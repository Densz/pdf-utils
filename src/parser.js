const PDFParser = require('pdf2json');

module.exports = {
  /**
   *
   * @param buffer
   * @param toCheck
   * @return {Promise}
   */
  async checkExist(buffer, toCheck){
    return new Promise((resolve, reject) => {
      const parser = new PDFParser();
      parser.on('pdfParser_dataError', () => {
        reject('BROKEN_LABEL');
      });
      parser.on('pdfParser_dataReady', (data) => {
        const exist = JSON.stringify(data).includes(toCheck);
        if(exist){
          return resolve(true);
        }
        reject(new Error('NOT_EXIST'));
      });
      parser.parseBuffer(buffer);
    });
  }
};
