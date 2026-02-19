import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const project = 'kvs';
    const envName = 'dev';
    const region = 'sg'; // Singapore

    // 1️⃣ Create VPC
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${project}-${envName}-vpc-${region}`,
      ipAddresses: ec2.IpAddresses.cidr('10.10.0.0/16'),
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // 2️⃣ Create IGW
    const igw = new ec2.CfnInternetGateway(this, 'IGW', {
      tags: [{ key: 'Name', value: `${project}-${envName}-igw-${region}` }],
    });

    new ec2.CfnVPCGatewayAttachment(this, 'IGWAttachment', {
      vpcId: this.vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    // 3️⃣ Route Tables
    const publicRt = new ec2.CfnRouteTable(this, 'PublicRT', {
      vpcId: this.vpc.vpcId,
      tags: [{ key: 'Name', value: `${project}-${envName}-pub-rt-${region}` }],
    });

    const privateRt = new ec2.CfnRouteTable(this, 'PrivateRT', {
      vpcId: this.vpc.vpcId,
      tags: [{ key: 'Name', value: `${project}-${envName}-pvt-rt-${region}` }],
    });

    // 4️⃣ Public Route
    new ec2.CfnRoute(this, 'PublicDefaultRoute', {
      routeTableId: publicRt.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // 5️⃣ Associate Public Subnets
    this.vpc.publicSubnets.forEach((subnet, i) => {
      new ec2.CfnSubnetRouteTableAssociation(this, `PubSub${i + 1}RTAssoc`, {
        subnetId: subnet.subnetId,
        routeTableId: publicRt.ref,
      });
    });

    // 6️⃣ Associate Private Subnets
    this.vpc.privateSubnets.forEach((subnet, i) => {
      new ec2.CfnSubnetRouteTableAssociation(this, `PvtSub${i + 1}RTAssoc`, {
        subnetId: subnet.subnetId,
        routeTableId: privateRt.ref,
      });
    });

    // 7️⃣ Outputs
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });

    this.vpc.publicSubnets.forEach((subnet, i) => {
      new cdk.CfnOutput(this, `PublicSubnet${i + 1}`, { value: subnet.subnetId });
    });

    this.vpc.privateSubnets.forEach((subnet, i) => {
      new cdk.CfnOutput(this, `PrivateSubnet${i + 1}`, { value: subnet.subnetId });
    });
  }
}
