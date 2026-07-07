Page({
  data: {
    ayi: null,
    notFound: false,
    backendError: '',
    form: {
      name: '',
      phone: '',
      date: '',
      address: '',
      note: ''
    }
  },

  onLoad(options) {
    const app = getApp();
    const allAyis = app.globalData.ayis || [];
    const id = options.id;
    const ayi = allAyis.find((item) => String(item.id) === String(id) || String(item._id) === String(id)) || null;
    this.setData({
      ayi,
      notFound: !ayi,
      backendError: app.globalData.backendError || ''
    });
  },

  updateField(event) {
    const field = event.currentTarget.dataset.field;
    const form = this.data.form;
    form[field] = event.detail.value;
    this.setData({ form });
  },

  submitBooking() {
    const app = getApp();
    if (!app.isLoggedIn()) {
      app.requireLogin().catch(() => {});
      return;
    }
    const { form, ayi } = this.data;
    if (!form.name || !form.phone || !form.date || !form.address) {
      wx.showToast({
        title: '请完善预约信息',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '提交中' });
    app.addAppointment(Object.assign({
      ayiId: ayi.id,
      ayiName: ayi.name,
      role: ayi.role || ayi.serviceType,
      serviceType: ayi.role || ayi.serviceType,
      customerName: form.name
    }, form)).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '预约已提交',
        icon: 'success'
      });

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/mine/mine'
        });
      }, 700);
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '服务暂时不可用，请稍后重试',
        icon: 'none'
      });
    });
  }
});
