const { PDFDocument, degrees } = require('pdf-lib');
const sharp = require('sharp');

/**
 * All save by options
 * @param {Object} options
 * @return {Promise<string|Uint8Array|Buffer>}
 */
PDFDocument.prototype.saveAs = async function(options = {}){
  if(options.out === 'base64'){
    return await this.saveAsBase64();
  } else if(options.out === 'buffer'){
    const uint8Array = await this.save();
    return Buffer.from(uint8Array);
  } else {
    return await this.save();
  }
};

/**
 * To standardize options
 * @param {Object} [options]
 * @param {string} [options.pageFormat]
 * @param {Array} [options.pageDimension]
 * @param {string} [options.type]
 * @param {Number} [options.x]
 * @param {Number} [options.y]
 * @param {Number} [options.width]
 * @param {Number} [options.height]
 * @param {string} [options.out]
 * @param [options.rotate]
 * @return {{rotate}|*}
 */
PDFDocument.formatOptions = function(options= {}){
  if(options.rotate){
    options.rotate = degrees(options.rotate);
  }
  if(!Array.isArray(options.pageFormat)){
    const PAGE_FORMAT = {
      'A4': [595.28, 841.89],
      'A6': [297.64, 419.53],
      '10x15': [297.64, 419.53],
      '16x30': [457, 842],
      '10x10': [300, 300],
    };
    options.pageDimension = PAGE_FORMAT[options.pageFormat];
  }
  return options;
};

module.exports = {
  merge, combine, convert, rotateAndResize
};



/**
 * Merge multiple pdf buffers.
 *
 * @param {Uint8Array[]} buffers
 * @param {Object} [options]
 * @return {Promise<Uint8Array>}
 */
async function merge(buffers, options){
  // format options
  options = PDFDocument.formatOptions(options);

  // Create a new PDFDocument
  const newPdf = await PDFDocument.create();

  const promises = buffers.map(async (buffer) => {
    return PDFDocument.load(buffer, { ignoreEncryption: true });
  });
  const pdfs = await Promise.all(promises);

  // Copy page to new PDF
  for(let pdf of pdfs){
    const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
    for(let page of pages){
      await newPdf.addPage(page);
    }
  }

  // Serialize the PDFDocument
  return await newPdf.saveAs(options);
}

/**
 * Combine two buffer
 * @param {Uint8Array} buffer1
 * @param {Uint8Array} buffer2
 * @param {Object} [options]
 * @return {Promise<Uint8Array>}
 */
async function combine(buffer1, buffer2, options){
  // format options
  options = PDFDocument.formatOptions(options);

  // Create a new PDFDocument
  const newPdf = await PDFDocument.create();

  // Add a blank page to the document
  const page = newPdf.addPage(options.pageDimension);

  // Embed pdf1
  const [pdf1] = await newPdf.embedPdf(buffer1);
  page.drawPage(pdf1);

  // Embed pdf2 with options
  const [pdf2] = await newPdf.embedPdf(buffer2);
  page.drawPage(pdf2, options);

  // Serialize the PDFDocument
  return await newPdf.saveAs(options);
}


/**
 * Convert to PDF
 * @param {Uint8Array|Buffer} input
 * @param {Object} [options]
 * @param {string} [options.pageFormat]
 * @param {Array} [options.pageDimension]
 * @param {string} [options.type]
 * @param {Number} [options.x]
 * @param {Number} [options.y]
 * @param {Number} [options.width]
 * @param {Number} [options.height]
 * @param [options.rotate]
 * @param [options.sharp]
 * @param {string} [options.out]
 * @return {Promise<Uint8Array|String>}
 */
async function convert(input, options){
  // format options
  options = PDFDocument.formatOptions(options);

  // Create a new PDFDocument
  const newPdf = await PDFDocument.create();

  // Add a blank page with demanded format
  const page = newPdf.addPage(options.pageDimension);

  // Add Image to the PDF Page
  const type = options.type;
  const imageOptions = {...page.getSize(), ...options};
  if(type === 'PDF'){
    const [newPage] = await newPdf.embedPdf(input);
    page.drawPage(newPage, imageOptions);
  }
  else if(type === 'PNG'){
    const image = await newPdf.embedPng(input);
    page.drawImage(image, imageOptions);
  }
  else if(type === 'JPG'){
    const image = await newPdf.embedJpg(input);
    page.drawImage(image, imageOptions);
  }
  else {
    const png = await rotateAndResize(input, options.sharp);
    const image = await newPdf.embedPng(png);
    page.drawImage(image, imageOptions);
  }

  // Serialize the PDFDocument
  return newPdf.saveAs(options);
}

/**
 * Rotate and Resize image
 * @param {Buffer} input
 * @param {Object} options
 * @return {Promise<Buffer>}
 */
async function rotateAndResize(input, options = {}){
  if(typeof input === 'string'){
    input = Buffer.from(input, 'base64');
  }
  const {rotate, width, height} = options;
  return sharp(input)
    .rotate(rotate)
    .resize({
      fit:'cover',
      cover:'crop',
      width:width,
      height:height,
      position:sharp.strategy.entropy
    })
    .toBuffer();
}

