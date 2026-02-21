import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const project = 'kvs';
    const env = 'dev';
    const region = 'sg';

    // ✅ Global Tags (Applied to ALL resources in this stack)
    cdk.Tags.of(this).add('Project', project);
    cdk.Tags.of(this).add('Environment', env);
    cdk.Tags.of(this).add('Layer', 'foundation');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
    cdk.Tags.of(this).add('Owner', 'platform-team');

    // ---------------------------
    // 1️⃣ VPC
    // ---------------------------
    const vpc = new ec2.CfnVPC(this, 'VPC', {
      cidrBlock: '10.10.0.0/16',
      tags: [{ key: 'Name', value: `${project}-${env}-vpc-${region}` }],
    });

    // ---------------------------
    // 2️⃣ Internet Gateway
    // ---------------------------
    const igw = new ec2.CfnInternetGateway(this, 'IGW', {
      tags: [{ key: 'Name', value: `${project}-${env}-igw-${region}` }],
    });

    new ec2.CfnVPCGatewayAttachment(this, 'IGWAttachment', {
      vpcId: vpc.ref,
      internetGatewayId: igw.ref,
    });

    // ---------------------------
    // 3️⃣ Route Tables
    // ---------------------------
    const publicRt = new ec2.CfnRouteTable(this, 'PublicRT', {
      vpcId: vpc.ref,
      tags: [{ key: 'Name', value: `${project}-${env}-public-rt-${region}` }],
    });

    const privateRt = new ec2.CfnRouteTable(this, 'PrivateRT', {
      vpcId: vpc.ref,
      tags: [{ key: 'Name', value: `${project}-${env}-private-rt-${region}` }],
    });

    new ec2.CfnRoute(this, 'PublicDefaultRoute', {
      routeTableId: publicRt.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // ---------------------------
    // 4️⃣ Subnets
    // ---------------------------
    const azs = cdk.Stack.of(this).availabilityZones;

    for (let i = 0; i < 3; i++) {
      const publicSubnet = new ec2.CfnSubnet(this, `PublicSubnet${i + 1}`, {
        vpcId: vpc.ref,
        cidrBlock: `10.10.${i}.0/24`,
        availabilityZone: azs[i],
        mapPublicIpOnLaunch: true,
        tags: [
          { key: 'Name', value: `${project}-${env}-pub-${i + 1}-${region}` },
        ],
      });

      new ec2.CfnSubnetRouteTableAssociation(
        this,
        `PublicAssoc${i + 1}`,
        {
          subnetId: publicSubnet.ref,
          routeTableId: publicRt.ref,
        }
      );

      const privateSubnet = new ec2.CfnSubnet(this, `PrivateSubnet${i + 1}`, {
        vpcId: vpc.ref,
        cidrBlock: `10.10.${i + 10}.0/24`,
        availabilityZone: azs[i],
        tags: [
          { key: 'Name', value: `${project}-${env}-pvt-${i + 1}-${region}` },
        ],
      });

      new ec2.CfnSubnetRouteTableAssociation(
        this,
        `PrivateAssoc${i + 1}`,
        {
          subnetId: privateSubnet.ref,
          routeTableId: privateRt.ref,
        }
      );
    }

    new cdk.CfnOutput(this, 'VpcId', { value: vpc.ref });
  }
}