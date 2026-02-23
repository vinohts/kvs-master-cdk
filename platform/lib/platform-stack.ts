import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class PlatformStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const project = 'kvs';
    const env = 'dev';
    const region = 'sg';

    // --------------------------------------------------
    // 1️⃣ Import Existing VPC from Foundation
    // --------------------------------------------------
    const vpc = ec2.Vpc.fromLookup(this, 'ImportedVpc', {
      tags: {
        Name: `${project}-${env}-vpc-${region}`, // Must match foundation VPC Name tag
      },
    });

    // --------------------------------------------------
    // 2️⃣ ECS Cluster
    // --------------------------------------------------
    const cluster = new ecs.Cluster(this, 'PlatformCluster', {
      vpc,
      clusterName: `${project}-${env}-ecs-cluster-${region}`,
    });

    // --------------------------------------------------
    // 3️⃣ ECR Repository
    // --------------------------------------------------
    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: `${project}-${env}-app-repo-${region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // change for prod
    });

    // --------------------------------------------------
    // 4️⃣ ALB Security Group
    // --------------------------------------------------
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
      securityGroupName: `${project}-${env}-alb-sg-${region}`,
    });

    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // --------------------------------------------------
    // 5️⃣ Application Load Balancer
    // --------------------------------------------------
    const alb = new elbv2.ApplicationLoadBalancer(this, 'PlatformAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      loadBalancerName: `${project}-${env}-alb-${region}`,
    });

    // --------------------------------------------------
    // 6️⃣ Listener
    // --------------------------------------------------
    const listener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // --------------------------------------------------
    // 7️⃣ Outputs
    // --------------------------------------------------
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
    });
  }
}