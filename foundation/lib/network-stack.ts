import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
