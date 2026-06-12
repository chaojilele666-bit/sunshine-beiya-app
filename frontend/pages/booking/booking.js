const { ayis } = require('../../data/ayis');

Page({
  data: {
    ayi: null,
    form: {
      name: '',
      phone: '',
      date: '',
      address: '',
      note: ''
    }
  },

  onLoad(options) {
    const allAyis = getApp().globalData.ayis && getApp().globalData.ayis.length ? getApp().globalData.ayis : ayis;
    const id = options.id;
    const ayi = allAyis.find((item) => String(item.id) === String(id) || String(item._id) === String(id)) || ayis[0];
    this.setData({ ayi });
  },

  updateField(event) {
    const field = event.currentTarget.dataset.field;
    const form = this.data.form;
    form[field] = event.detail.value;
    this.setData({ form });
  },

  submitBooking() {
    const { form, ayi } = this.data;
    if (!form.name || !form.phone || !form.date || !form.address) {
      wx.showToast({
        title: '请完善预约信息',
        icon: 'none'
      });
      return;
    }

    getApp().addAppointment(Object.assign({
      ayiId: ayi.id,
      ayiName: ayi.name,
      role: ayi.role || ayi.serviceType,
      serviceType: ayi.role || ayi.serviceType,
      customerName: form.name
    }, form));

    wx.showToast({
      title: '预约已提交',
      icon: 'success'
    });

    setTimeout(() => {
      wx.switchTab({
        url: '/pages/mine/mine'
      });
    }, 700);
  }
});
