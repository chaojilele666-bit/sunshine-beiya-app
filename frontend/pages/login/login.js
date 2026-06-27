Page({
  data: {
    loading: false,
    message: '',
    redirect: ''
  },

  onLoad(options) {
    this.setData({
      redirect: options && options.redirect ? decodeURIComponent(options.redirect) : ''
    });
  },

  onShow() {
    const app = getApp();
    if (app.isLoggedIn()) {
      app.resumeAfterLogin(this.data.redirect || '/pages/home/home');
    }
  },

  finishLogin(result) {
    const app = getApp();
    const user = result && result.user ? result.user : {};
    if (user.role === 'customer' || user.role === 'ayi') {
      app.setRole(user.role);
    }
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
    setTimeout(() => {
      app.resumeAfterLogin(this.data.redirect || '/pages/home/home');
    }, 400);
  },

  showError(error, fallback) {
    const app = getApp();
    const message = app.normalizeErrorMessage(error, fallback);
    this.setData({
      loading: false,
      message
    });
  },

  loginWithWechat() {
    if (this.data.loading) return;
    this.setData({ loading: true, message: '' });
    getApp().loginWithWechat()
      .then((result) => {
        this.setData({ loading: false });
        this.finishLogin(result);
      })
      .catch((error) => {
        this.showError(error, '微信登录失败，请稍后重试');
      });
  },

  loginWithPhone(event) {
    if (this.data.loading) return;
    const detail = event.detail || {};
    if (detail.errMsg && detail.errMsg.indexOf('ok') < 0) {
      this.showError(new Error('您已取消手机号授权'), '您已取消手机号授权');
      return;
    }
    const phoneCode = detail.code;
    if (!phoneCode) {
      this.showError(new Error('手机号授权失败'), '手机号授权失败');
      return;
    }
    this.setData({ loading: true, message: '' });
    getApp().loginWithWechatPhone(phoneCode)
      .then((result) => {
        this.setData({ loading: false });
        this.finishLogin(result);
      })
      .catch((error) => {
        this.showError(error, '手机号授权失败');
      });
  },

  continueAsGuest() {
    const app = getApp();
    app.enterGuestMode();
    const target = this.data.redirect || '/pages/home/home';
    const path = target.split('?')[0];
    if (['/pages/home/home', '/pages/service/service', '/pages/stores/stores', '/pages/mine/mine'].includes(path)) {
      wx.switchTab({ url: path });
      return;
    }
    wx.navigateTo({
      url: target,
      fail: () => wx.switchTab({ url: '/pages/home/home' })
    });
  }
});
