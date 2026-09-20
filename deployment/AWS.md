# Deploying to AWS

This guide deploys the same Docker images the CI pipeline already builds ([`backend/Dockerfile`](../backend/Dockerfile), [`frontend/Dockerfile`](../frontend/Dockerfile)) onto AWS, with **MongoDB Atlas** as the database (same as [PHASE1.md](./PHASE1.md) — Atlas works fine from any cloud, so there's no need to migrate to DocumentDB).

> **Cost warning:** unlike Render/Vercel's free tiers used in Phase 1, none of the AWS paths below are meaningfully free to leave running. Read [Costs & cleanup](#costs--cleanup) before you provision anything, and tear down when you're done demoing.

## Which path should you pick?

| Path | Good for | Monthly cost (idle, us-east-1) | Ops complexity |
|------|----------|-----------------------------|-----------------|
| **A. ECS Fargate + ALB + ECR** | The strongest "AWS on my CV" signal — real container orchestration, load balancing, IAM | ~$30–45 | Highest — VPC, security groups, ALB, ECS |
| **B. AWS App Runner** | A working AWS demo without managing a VPC/ALB | ~$5–15 (scales down when idle) | Low — a handful of CLI calls |
| **C. Single EC2 + docker-compose** | Cheapest, and reuses your existing `docker-compose.yml` as-is | Free for 12 months (t3.micro free tier), then ~$7–8 | Low, but you own patching/uptime |

This guide covers **Path A** in full depth (it's the one worth understanding for interviews), then gives condensed steps for B and C. Pick one — don't run more than one at a time, or you'll pay for all of them.

All paths assume:
- AWS CLI v2 installed and configured (`aws configure`), with a region exported: `export AWS_REGION=us-east-1`
- Docker installed locally
- A MongoDB Atlas cluster already provisioned — via [`infra/terraform/`](../infra/terraform/) or manually per [PHASE1.md §1](./PHASE1.md#1-mongodb-atlas) — with its connection string handy

---

## Path A: ECS Fargate + Application Load Balancer + ECR

### Architecture

```text
Browser
   │  HTTPS/HTTP
   ▼
Application Load Balancer (public subnet)
   │
   ├── path "/api/*"  ──▶ Target Group: backend  ──▶ ECS Fargate task (backend:5000)
   └── path "/*"       ──▶ Target Group: frontend ──▶ ECS Fargate task (frontend:3000)
                                                              │
                                                              ▼
                                                    MongoDB Atlas (internet, TLS)
```

One ALB, path-based routing, both services in one ECS cluster. Because the browser talks to *one* origin (the ALB's DNS name) for both the app and the API, this sidesteps most CORS concerns — `/api/*` and `/` are the same origin from the browser's point of view.

### 1. Create ECR repositories

```bash
aws ecr create-repository --repository-name appointment-backend
aws ecr create-repository --repository-name appointment-frontend
```

### 2. Build and push the backend image

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR"

docker build -t "$ECR/appointment-backend:latest" ./backend
docker push "$ECR/appointment-backend:latest"
```

### 3. Networking, security groups, and the ALB

Using the default VPC keeps this simple (skip VPC creation if you already have one you're happy with).

```bash
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SUBNET_IDS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID --query 'Subnets[].SubnetId' --output text | tr '\t' ',')

# ALB security group: public HTTP in
ALB_SG=$(aws ec2 create-security-group --group-name appointment-alb-sg --description "ALB" --vpc-id "$VPC_ID" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 80 --cidr 0.0.0.0/0

# Task security group: only reachable from the ALB
TASK_SG=$(aws ec2 create-security-group --group-name appointment-task-sg --description "ECS tasks" --vpc-id "$VPC_ID" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$TASK_SG" --protocol tcp --port 5000 --source-group "$ALB_SG"
aws ec2 authorize-security-group-ingress --group-id "$TASK_SG" --protocol tcp --port 3000 --source-group "$ALB_SG"

ALB_ARN=$(aws elbv2 create-load-balancer --name appointment-alb --subnets $(echo $SUBNET_IDS | tr ',' ' ') \
  --security-groups "$ALB_SG" --query 'LoadBalancers[0].LoadBalancerArn' --output text)
ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].DNSName' --output text)
echo "ALB DNS: $ALB_DNS"

BACKEND_TG=$(aws elbv2 create-target-group --name appointment-backend-tg --protocol HTTP --port 5000 \
  --vpc-id "$VPC_ID" --target-type ip --health-check-path /health --query 'TargetGroups[0].TargetGroupArn' --output text)
FRONTEND_TG=$(aws elbv2 create-target-group --name appointment-frontend-tg --protocol HTTP --port 3000 \
  --vpc-id "$VPC_ID" --target-type ip --health-check-path / --query 'TargetGroups[0].TargetGroupArn' --output text)

LISTENER_ARN=$(aws elbv2 create-listener --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG --query 'Listeners[0].ListenerArn' --output text)

aws elbv2 create-rule --listener-arn "$LISTENER_ARN" --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=$BACKEND_TG
```

Note the ALB DNS name printed above — you need it for the next step.

### 4. Build and push the frontend image (now that you have the ALB DNS)

`NEXT_PUBLIC_API_URL` is baked into the JS bundle at **build time** (see [`frontend/Dockerfile`](../frontend/Dockerfile)'s `ARG`/`ENV`), so the ALB must exist first:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL="http://$ALB_DNS/api" \
  -t "$ECR/appointment-frontend:latest" ./frontend
docker push "$ECR/appointment-frontend:latest"
```

If you ever change the domain later, you must rebuild and redeploy the frontend image — changing an env var at container runtime won't affect an already-built bundle.

### 5. Secrets

```bash
aws secretsmanager create-secret --name appointment/mongodb-uri --secret-string "mongodb+srv://..."
aws secretsmanager create-secret --name appointment/jwt-secret --secret-string "$(openssl rand -hex 64)"
```

### 6. ECS cluster, task execution role, and task definitions

```bash
aws ecs create-cluster --cluster-name appointment-cluster

aws logs create-log-group --log-group-name /ecs/appointment-backend
aws logs create-log-group --log-group-name /ecs/appointment-frontend
```

The task execution role needs `AmazonECSTaskExecutionRolePolicy` plus permission to read the two secrets:

```bash
aws iam create-role --role-name appointmentTaskExecutionRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
aws iam attach-role-policy --role-name appointmentTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam put-role-policy --role-name appointmentTaskExecutionRole --policy-name SecretsAccess \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"secretsmanager:GetSecretValue","Resource":["arn:aws:secretsmanager:*:'"$ACCOUNT_ID"':secret:appointment/*"]}]}'
```

`backend-task-def.json`:

```json
{
  "family": "appointment-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/appointmentTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/appointment-backend:latest",
      "portMappings": [{ "containerPort": 5000 }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "TRUST_PROXY", "value": "true" },
        { "name": "FRONTEND_URL", "value": "http://ALB_DNS_NAME" },
        { "name": "JWT_EXPIRE", "value": "7d" }
      ],
      "secrets": [
        { "name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:appointment/mongodb-uri" },
        { "name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:appointment/jwt-secret" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/appointment-backend",
          "awslogs-region": "REGION",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

`frontend-task-def.json` is the same shape: `family: appointment-frontend`, image `appointment-frontend:latest`, `containerPort: 3000`, no secrets needed (the API URL is already baked in), same `logConfiguration` pattern pointing at `/ecs/appointment-frontend`.

Replace `ACCOUNT_ID`, `REGION`, and `ALB_DNS_NAME` with your real values in both files, then register and run:

```bash
aws ecs register-task-definition --cli-input-json file://backend-task-def.json
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json

aws ecs create-service --cluster appointment-cluster --service-name backend \
  --task-definition appointment-backend --desired-count 1 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$TASK_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$BACKEND_TG,containerName=backend,containerPort=5000"

aws ecs create-service --cluster appointment-cluster --service-name frontend \
  --task-definition appointment-frontend --desired-count 1 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$TASK_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$FRONTEND_TG,containerName=frontend,containerPort=3000"
```

### 7. Verify

```bash
curl http://$ALB_DNS/api/../health   # or just: curl http://$ALB_DNS/health via the /api rule if you route /health too
```

Open `http://<ALB_DNS>` in a browser — same checklist as [PHASE1.md](./PHASE1.md#checklist): login page loads, register/login work, no CORS errors in DevTools.

### 8. HTTPS (recommended before sharing the link)

Request a free cert in ACM (needs a domain in Route 53 or another registrar pointed at the ALB), add an HTTPS:443 listener using that cert forwarding to the same target groups, and either redirect the HTTP:80 listener to HTTPS or leave both. This is the same pattern as any ALB + ACM setup — not appointment-app-specific.

---

## CI/CD: auto-deploy from GitHub Actions

Avoid long-lived AWS access keys in GitHub secrets — use **OIDC federation** instead: GitHub's token service issues a short-lived token that AWS trusts directly.

1. Create the OIDC identity provider (one-time, per AWS account):

   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
   ```

2. Create an IAM role trusting your repo, with permissions for ECR push + `ecs:UpdateService`:

   ```bash
   aws iam create-role --role-name github-actions-appointment-deploy \
     --assume-role-policy-document '{
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": { "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": { "StringEquals": { "token.actions.githubusercontent.com:sub": "repo:Hazrat16/appointment:ref:refs/heads/main" } }
       }]
     }'
   ```

   Attach `AmazonEC2ContainerRegistryPowerUser` and an inline policy allowing `ecs:UpdateService`/`ecs:DescribeServices` on your cluster's services.

3. Add a job to [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), after the existing `docker-publish` job:

   ```yaml
     deploy-aws:
       name: Deploy to ECS
       runs-on: ubuntu-latest
       needs: docker-publish
       if: github.event_name == 'push' && github.ref == 'refs/heads/main'
       permissions:
         id-token: write   # required for OIDC
         contents: read
       steps:
         - uses: actions/checkout@v4

         - uses: aws-actions/configure-aws-credentials@v4
           with:
             role-to-assume: arn:aws:iam::ACCOUNT_ID:role/github-actions-appointment-deploy
             aws-region: us-east-1

         - uses: aws-actions/amazon-ecr-login@v2
           id: ecr

         - name: Build and push backend
           run: |
             docker build -t ${{ steps.ecr.outputs.registry }}/appointment-backend:${{ github.sha }} ./backend
             docker push ${{ steps.ecr.outputs.registry }}/appointment-backend:${{ github.sha }}

         - name: Build and push frontend
           run: |
             docker build --build-arg NEXT_PUBLIC_API_URL="http://YOUR_ALB_DNS/api" \
               -t ${{ steps.ecr.outputs.registry }}/appointment-frontend:${{ github.sha }} ./frontend
             docker push ${{ steps.ecr.outputs.registry }}/appointment-frontend:${{ github.sha }}

         - name: Force new ECS deployments
           run: |
             aws ecs update-service --cluster appointment-cluster --service backend --force-new-deployment
             aws ecs update-service --cluster appointment-cluster --service frontend --force-new-deployment
   ```

   This redeploys on every merge to `main`, reusing the images the `docker-publish` job already validated builds cleanly. (You could also point ECS at the GHCR images directly instead of ECR — Fargate can pull from GHCR if the package is public or a repository-credentials secret is configured — but ECR is the more common pattern in AWS-based interviews and setups.)

---

## Path B: AWS App Runner (simpler, cheaper)

No VPC/ALB/security-group management — App Runner handles the load balancer, TLS, and scaling (including down to near-zero) for you.

```bash
# after pushing both images to ECR as in Path A steps 1–2 (build frontend with its own
# apprunner URL once you know it — same chicken-and-egg as the ALB DNS above)

aws apprunner create-service --service-name appointment-backend \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "'"$ECR"'/appointment-backend:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": { "Port": "5000", "RuntimeEnvironmentSecrets": {
        "MONGODB_URI": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:appointment/mongodb-uri",
        "JWT_SECRET": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:appointment/jwt-secret"
      }, "RuntimeEnvironmentVariables": { "NODE_ENV": "production", "TRUST_PROXY": "true" } }
    },
    "AutoDeploymentsEnabled": false
  }'
```

Grab the resulting service URL (`aws apprunner describe-service ... --query 'Service.ServiceUrl'`), then build/push the frontend image with `NEXT_PUBLIC_API_URL=https://<backend-service-url>/api`, and create a second App Runner service for it the same way. Unlike Path A, frontend and backend get **different origins** here, so set the backend's `FRONTEND_URL` to the frontend's App Runner URL — this is a real cross-origin setup, so CORS actually matters.

## Path C: Single EC2 instance + docker-compose

Reuses [`docker-compose.yml`](../docker-compose.yml) exactly as-is — closest to your local setup, cheapest, but you're the one patching the OS and keeping it up.

1. Launch a `t3.micro` (free-tier eligible) Amazon Linux 2023 or Ubuntu instance. Security group: allow inbound 22 (SSH, your IP only), 3000, 5000.
2. SSH in, install Docker + Compose plugin (`sudo dnf install -y docker && sudo systemctl enable --now docker`, then the [Compose plugin](https://docs.docker.com/compose/install/linux/)).
3. `git clone` this repo, set a real `JWT_SECRET` in a root `.env` (see [docker-compose.yml](../docker-compose.yml) — it defaults to a dev secret otherwise), and:

   ```bash
   docker compose up -d --build
   ```
4. Open `http://<ec2-public-ip>:3000`. For a real domain + HTTPS, put Nginx in front with a Let's Encrypt cert (out of scope here — same pattern as fronting any Node app on a VM).

---

## Costs & cleanup

| Resource | Rough monthly cost if left running |
|----------|-------------------------------------|
| Application Load Balancer | ~$16 base + data processing |
| 2× Fargate tasks (0.25 vCPU / 0.5GB each) | ~$9–15 |
| ECR storage | Pennies at this image size |
| App Runner (2 services, low traffic) | ~$5–15, scales down when idle |
| EC2 t3.micro | Free for 12 months, then ~$7–8 |
| MongoDB Atlas (M0/Flex free tier) | $0 |

**Tear down Path A** when you're done demoing:

```bash
aws ecs update-service --cluster appointment-cluster --service backend --desired-count 0
aws ecs update-service --cluster appointment-cluster --service frontend --desired-count 0
aws ecs delete-service --cluster appointment-cluster --service backend --force
aws ecs delete-service --cluster appointment-cluster --service frontend --force
aws elbv2 delete-listener --listener-arn "$LISTENER_ARN"
aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN"
aws elbv2 delete-target-group --target-group-arn "$BACKEND_TG"
aws elbv2 delete-target-group --target-group-arn "$FRONTEND_TG"
aws ecs delete-cluster --cluster appointment-cluster
aws ecr delete-repository --repository-name appointment-backend --force
aws ecr delete-repository --repository-name appointment-frontend --force
aws secretsmanager delete-secret --secret-id appointment/mongodb-uri --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id appointment/jwt-secret --force-delete-without-recovery
aws ec2 delete-security-group --group-id "$TASK_SG"
aws ec2 delete-security-group --group-id "$ALB_SG"
```

**Path B:** `aws apprunner delete-service --service-arn <arn>` for each service, then delete the ECR repos/secrets as above.

**Path C:** terminate the EC2 instance.

Your MongoDB Atlas cluster (managed via [`infra/terraform/`](../infra/terraform/)) isn't AWS infrastructure and has no ongoing AWS cost — leave it running, or `terraform destroy` if you want it gone too.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| ECS task stuck "PROVISIONING" or keeps restarting | `aws logs tail /ecs/appointment-backend --follow` — usually a missing/misnamed secret, or `MONGODB_URI` unreachable |
| `CannotPullContainerError` | Task execution role is missing ECR pull permissions, or the image tag doesn't exist in ECR |
| ALB returns 503 | Target group has zero healthy targets — check the security group allows ALB→task traffic on the container port, and the health check path returns 200 |
| Frontend loads but API calls fail / wrong URL | `NEXT_PUBLIC_API_URL` is baked in at build time — you must rebuild and redeploy the frontend image after any URL change, not just restart the task |
| CORS errors in the browser (Path B/C only) | `FRONTEND_URL` on the backend must exactly match the frontend's origin (scheme + host, no trailing slash) |
| Works via `curl` but not in the browser | Usually a stale cached JS bundle — hard-refresh or try an incognito window |
