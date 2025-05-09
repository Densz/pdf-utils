const converter = require('./converter');
const parser = require('./parser');
const Builder = require('./builder');

module.exports = {
  async merge(buffers){
    return await converter.merge(buffers);
  },

  async formatDHL(buffer, options){
    return await converter.convert(buffer, {
      type: 'PDF',
      pageFormat: '10x15',
      width: 1300,
      x: -120,
      ...options
    });
  },

  async formatCP(buffer, options){
    return await converter.convert(buffer, {
      type: 'PDF',
      pageFormat: '10x10',
      height: 420,
      y:-125,
      ...options
    });
  },

  async formatUPS(buffer, options = {}){
    const labelSize = options.labelSize;
    delete options.labelSize;
    if(options.labelFormat === 'pdf'){
      return await converter.convert(buffer, {
        type: 'GIF',
        pageFormat: labelSize,
        sharp: {rotate: 90, width: 800, height: 1400},
        ...options
      });
    } else {
      const arrayBuffer = await converter.rotateAndResize(buffer, {rotate: 90, width: 800, height: 1200});
      return Buffer.from(arrayBuffer).toString('base64');
    }
  },

  async formatDPD(buffer1, buffer2, options){
    return await converter.combine(buffer1, buffer2, {y: -400, ...options});
  },

  async checkAsendiaLabel(buffer, trackingNumber){
    try {
      return await parser.checkExist(buffer, trackingNumber);
    } catch(error){
      throw new Error('Wrong Label from Asendia Server, Retry later')
    }
  },

  builder(){
    return new Builder();
  }
};
