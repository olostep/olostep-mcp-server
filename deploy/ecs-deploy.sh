#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
REPO_NAME="${REPO_NAME:-olostep-mcp-server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CLUSTER_NAME="${CLUSTER_NAME:-olostep-mcp}"
TASK_FAMILY="${TASK_FAMILY:-olostep-mcp-task}"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:${IMAGE_TAG}"
EXECUTION_ROLE="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole"

# Create ECS cluster (no-op if it already exists)
aws ecs create-cluster --cluster-name "${CLUSTER_NAME}" --region "${AWS_REGION}" > /dev/null 2>&1 || true

# Ensure CloudWatch log group exists
aws logs create-log-group --log-group-name "/ecs/${TASK_FAMILY}" --region "${AWS_REGION}" 2>/dev/null || true

# Register task definition
aws ecs register-task-definition \
  --family "${TASK_FAMILY}" \
  --requires-compatibilities FARGATE \
  --network-mode awsvpc \
  --cpu 256 \
  --memory 512 \
  --execution-role-arn "${EXECUTION_ROLE}" \
  --container-definitions "[
    {
      \"name\": \"${REPO_NAME}\",
      \"image\": \"${ECR_URI}\",
      \"portMappings\": [{\"containerPort\": 3000, \"protocol\": \"tcp\"}],
      \"environment\": [
        {\"name\": \"TRANSPORT\", \"value\": \"http\"},
        {\"name\": \"PORT\",      \"value\": \"3000\"}
      ],
      \"logConfiguration\": {
        \"logDriver\": \"awslogs\",
        \"options\": {
          \"awslogs-group\":         \"/ecs/${TASK_FAMILY}\",
          \"awslogs-region\":        \"${AWS_REGION}\",
          \"awslogs-stream-prefix\": \"ecs\"
        }
      },
      \"healthCheck\": {
        \"command\":  [\"CMD-SHELL\", \"wget -qO- http://localhost:3000/health || exit 1\"],
        \"interval\": 30,
        \"timeout\":  5,
        \"retries\":  3
      }
    }
  ]" \
  --region "${AWS_REGION}" > /dev/null

echo "Cluster:         ${CLUSTER_NAME}"
echo "Task definition: ${TASK_FAMILY} (latest revision)"
echo ""
echo "Next: create / update a Fargate service:"
echo ""
echo "  aws ecs create-service \\"
echo "    --cluster ${CLUSTER_NAME} \\"
echo "    --service-name olostep-mcp-service \\"
echo "    --task-definition ${TASK_FAMILY} \\"
echo "    --desired-count 1 \\"
echo "    --launch-type FARGATE \\"
echo "    --network-configuration 'awsvpcConfiguration={subnets=[<SUBNET_ID>],securityGroups=[<SG_ID>],assignPublicIp=ENABLED}' \\"
echo "    --load-balancers 'targetGroupArn=<TG_ARN>,containerName=${REPO_NAME},containerPort=3000' \\"
echo "    --region ${AWS_REGION}"
