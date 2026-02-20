import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const project = 'kvs';
    const envName = 'dev';
    const regionCode = 'sg';

    // ✅ 1. Create VPC WITHOUT automatic subnet route tables
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${project}-${envName}-vpc-${regionCode}`,
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

    // Get automatically created IGW
    const igw = this.vpc.node
      .findChild('IGW') as ec2.CfnInternetGateway;

    // ✅ 2. Create ONE Public Route Table
    const publicRt = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: this.vpc.vpcId,
      tags: [
        { key: 'Name', value: `${project}-${envName}-public-rt-${regionCode}` },
      ],
    });

    // Default route to IGW
    new ec2.CfnRoute(this, 'PublicDefaultRoute', {
      routeTableId: publicRt.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // ✅ 3. Create ONE Private Route Table
    const privateRt = new ec2.CfnRouteTable(this, 'PrivateRouteTable', {
      vpcId: this.vpc.vpcId,
      tags: [
        { key: 'Name', value: `${project}-${envName}-private-rt-${regionCode}` },
      ],
    });

    // ✅ 4. Associate ALL Public Subnets to Public RT
    this.vpc.publicSubnets.forEach((subnet, index) => {
      new ec2.CfnSubnetRouteTableAssociation(
        this,
        `PublicSubnetAssoc${index + 1}`,
        {
          subnetId: subnet.subnetId,
          routeTableId: publicRt.ref,
        }
      );
    });

    // ✅ 5. Associate ALL Private Subnets to Private RT
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnSubnetRouteTableAssociation(
        this,
        `PrivateSubnetAssoc${index + 1}`,
        {
          subnetId: subnet.subnetId,
          routeTableId: privateRt.ref,
        }
      );
    });

    // ✅ Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
    });
  }
}