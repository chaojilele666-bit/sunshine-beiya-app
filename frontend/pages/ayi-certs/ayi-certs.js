Page({
  data: {
    certs: {
      idCard: '',
      healthCert: '',
      skillCert: ''
    },
    idCardText: '用于身份核验',
    healthCertText: '用于健康资料审核',
    skillCertText: '月嫂证、育婴师证、护工证等'
  },

  onLoad() {
    const profile = getApp().globalData.ayiProfile;
    if (profile && profile.certs) {
      this.setData({
        certs: profile.certs,
        idCardText: profile.certs.idCard ? '已选择图片' : '用于身份核验',
        healthCertText: profile.certs.healthCert ? '已选择图片' : '用于健康资料审核',
        skillCertText: profile.certs.skillCert ? '已选择图片' : '月嫂证、育婴师证、护工证等'
      });
    }
  },

  chooseCert(event) {
    const type = event.currentTarget.dataset.type;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const certs = this.data.certs;
        certs[type] = res.tempFilePaths[0];

        const nextData = { certs };
        if (type === 'idCard') nextData.idCardText = '已选择图片';
        if (type === 'healthCert') nextData.healthCertText = '已选择图片';
        if (type === 'skillCert') nextData.skillCertText = '已选择图片';
        this.setData(nextData);
      }
    });
  },

  saveCerts() {
    const app = getApp();
    if (!app.isLoggedIn()) {
      app.requireLogin().catch(() => {});
      return;
    }
    const profile = app.globalData.ayiProfile || {};
    app.saveAyiProfile(Object.assign({}, profile, {
      certs: this.data.certs
    }));

    wx.showToast({
      title: '证件已保存',
      icon: 'success'
    });
  }
});
