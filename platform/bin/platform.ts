#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PlatformStack } from '../lib/platform-stack';

const app = new cdk.App();

new PlatformStack(app, 'kvs-dev-platform-sg', {
  env: {
    account: '758890598841',
    region: 'ap-southeast-1',
  },
});