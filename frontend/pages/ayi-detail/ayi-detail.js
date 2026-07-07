Page({
  data: {
    ayi: null,
    notFound: false,
    backendError: ''
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

  goBooking() {
    wx.navigateTo({
      url: `/pages/booking/booking?id=${this.data.ayi.id}`
    });
  }
});
