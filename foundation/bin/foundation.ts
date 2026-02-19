#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';

const app = new cdk.App();
new NetworkStack(app, 'NetworkStack', {
  env: {
    account: '758890598841',
    region: 'ap-southeast-1',
  },
});
