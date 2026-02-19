import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'KvsDevVpc', {
      vpcName: 'kvs-dev-vpc-sg',
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
        }
      ],
    });

    // Enterprise-style route tables
    const publicRt = new ec2.CfnRouteTable(this, 'PublicRT', {
      vpcId: this.vpc.vpcId,
      tags: [{ key: 'Name', value: 'kvs-dev-vpc-sg-public-rt' }],
    });

    const privateRt = new ec2.CfnRouteTable(this, 'PrivateRT', {
      vpcId: this.vpc.vpcId,
      tags: [{ key: 'Name', value: 'kvs-dev-vpc-sg-private-rt' }],
    });

    // Attach IGW to public route table
    const igw = new ec2.CfnInternetGateway(this, 'IGW', {
      tags: [{ key: 'Name', value: 'kvs-dev-igw-sg' }],
    });

    new ec2.CfnVPCGatewayAttachment(this, 'IGWAttachment', {
      vpcId: this.vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    new ec2.CfnRoute(this, 'PublicRoute', {
      routeTableId: publicRt.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // Associate public subnets to public RT
    this.vpc.publicSubnets.forEach((subnet, i) => {
      new ec2.CfnSubnetRouteTableAssociation(this, `PublicSubnetRTAssoc${i + 1}`, {
        subnetId: subnet.subnetId,
        routeTableId: publicRt.ref,
      });
    });

    // Associate private subnets to private RT
    this.vpc.privateSubnets.forEach((subnet, i) => {
      new ec2.CfnSubnetRouteTableAssociation(this, `PrivateSubnetRTAssoc${i + 1}`, {
        subnetId: subnet.subnetId,
        routeTableId: privateRt.ref,
      });
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    this.vpc.publicSubnets.forEach((subnet, i) => {
      new cdk.CfnOutput(this, `PublicSubnet${i + 1}`, { value: subnet.subnetId });
    });
    this.vpc.privateSubnets.forEach((subnet, i) => {
      new cdk.CfnOutput(this, `PrivateSubnet${i + 1}`, { value: subnet.subnetId });
    });
  }
}
