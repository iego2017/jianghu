'use strict';

const assert = require('assert');
const sinon = require('sinon');
const path = require('path');
const mock = require('egg-mock');
const utils = require('../../utils');
const xiaochengxuPageAuthorization = require('../../../plugins/xiaochengxu/app/middleware/xiaochengxuPageAuthorization');

describe('test/app/middleware/xiaochengxuPageAuthorization.test.js', () => {
  before(() => {
    this.app = utils.app('apps/jianghu-config');
    return this.app.ready();
  });
  after(async () => {
    await utils.deleteFileAndDirByPath(path.join(process.cwd(), 'test/fixtures/apps/jianghu-config/run'));
    await utils.deleteFileAndDirByPath(path.join(process.cwd(), 'test/fixtures/apps/jianghu-config/logs'));
    this.app.close();
  });

  describe('Test middleware xiaochengxuPageAuthorization', () => {
    beforeEach(() => {
      const jianghuKnexResult = {
        select: () => {},
      };
      this.ctx = this.app.mockContext({});
      mock(this.app, 'jianghuKnex', () => {
        return jianghuKnexResult;
      });
      this.xiaochengxuPageAuthorization = xiaochengxuPageAuthorization();
      this.nextSpy = sinon.spy();
      this.redirectStub = sinon.stub(this.ctx, 'redirect');
      this.selectStub = sinon.stub(jianghuKnexResult, 'select');
    });
    afterEach(() => {
      this.selectStub.restore();
      this.redirectStub.restore();
      mock.restore();
    });
    it('should success', async () => {
      const expUserId = 'test101';
      const expDeviceId = `${Date.now()}`;
      const expPageId = 'index';
      const expResponseStatus = 200;
      const expPackageId = `package_${Date.now()}`;
      const expRequestBody = {
        packageId: expPackageId,
        appData: {
          actionData: {},
        },
      };
      const expResponseBody = {
        status: expResponseStatus,
      };
      const expUser = {
        userId: expUserId,
        username: 'username',
        deviceId: expDeviceId,
        userStatus: 'active',
        md5Salt: 'test',
      };
      const expAllUserGroupRolePageList = [{
        group: 'public',
        role: '*',
        page: expPageId,
      }];

      this.ctx.userInfo = {
        user: expUser,
        allowPageList: [{ page: expPageId }],
      };
      this.ctx.packagePage = {
        page: expPageId,
      };
      this.ctx.request.body = expRequestBody;
      this.ctx.body = expResponseBody;

      this.selectStub.returns(expAllUserGroupRolePageList);

      await this.xiaochengxuPageAuthorization(this.ctx);

      assert.deepEqual(this.selectStub.callCount, 1);
      assert.deepEqual(this.redirectStub.callCount, 0);
    });
    it('should failed, user_status not active', async () => {
      const expUserId = 'test101';
      const expDeviceId = `${Date.now()}`;
      const expPageId = 'index';
      const expResponseStatus = 200;
      const expPackageId = `package_${Date.now()}`;
      const expRequestBody = {
        packageId: expPackageId,
        appData: {
          actionData: {},
        },
      };
      const expResponseBody = {
        status: expResponseStatus,
      };
      const expUser = {
        userId: expUserId,
        username: 'username',
        deviceId: expDeviceId,
        userStatus: 'inactive',
        md5Salt: 'test',
      };
      const expAllUserGroupRolePageList = [{
        group: 'public',
        role: 'role1',
        page: expPageId,
      }];

      this.ctx.userInfo = {
        user: expUser,
        allowPageList: [{ page: expPageId }],
      };
      this.ctx.packagePage = {
        page: expPageId,
        resourceData: {},
      };
      this.ctx.request.body = expRequestBody;
      this.ctx.body = expResponseBody;

      this.selectStub.returns(expAllUserGroupRolePageList);

      let error;
      try {
        await this.xiaochengxuPageAuthorization(this.ctx);
      } catch (err) {
        error = err;
      }

      assert.deepEqual(this.selectStub.callCount, 1);
      assert.deepEqual(error.errorCode, 'user_status_error');
    });
    it('should failed, page forbidden', async () => {
      const expUserId = 'test101';
      const expDeviceId = `${Date.now()}`;
      const expPageId = 'index';
      const expResponseStatus = 200;
      const expPackageId = `package_${Date.now()}`;
      const expRequestBody = {
        packageId: expPackageId,
        appData: {
          actionData: {
            groupId: 'groupId1',
          },
        },
      };
      const expResponseBody = {
        status: expResponseStatus,
      };
      const expUser = {
        userId: expUserId,
        username: 'username',
        deviceId: expDeviceId,
        userStatus: 'active',
        md5Salt: 'test',
      };
      const expAllUserGroupRolePageList = [{
        group: 'public',
        role: '*',
        page: expPageId,
      }];

      this.ctx.userInfo = {
        user: expUser,
        allowPageList: [{ pageId: '1' }],
        groupId: 'groupId2',
        userGroupRoleList: [],
      };
      this.ctx.packagePage = {
        pageId: expPageId,
        resourceData: {
          isGroupIdRequired: true,
        },
      };
      this.ctx.request.body = expRequestBody;
      this.ctx.body = expResponseBody;

      this.selectStub.returns(expAllUserGroupRolePageList);
      let error;
      try {
        await this.xiaochengxuPageAuthorization(this.ctx);
      } catch (err) {
        error = err;
      }

      assert.deepEqual(this.selectStub.callCount, 1);
      assert.deepEqual(error.errorCode, 'page_forbidden');
    });
  });
});
