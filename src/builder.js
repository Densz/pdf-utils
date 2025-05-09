const { PDFDocument, rgb, degrees } = require('pdf-lib');

module.exports = {
  build, buildInvoice
};

async function buildInvoice(){
  // Create a new PDFDocument
  const newPdf = await PDFDocument.create();
  const page = newPdf.addPage();

}

async function build(logo, wechat){
  // Create a new PDFDocument
  const newPdf = await PDFDocument.create();
  let page = newPdf.addPage();

  // SVG
  const {width, height} = page.getSize();
  const svgPath = `M 0,300 V 0 H ${width} V 120 Z`;
  page.drawSvgPath(svgPath, {
    x: 0,
    y: height,
    color: rgb(37 / 255, 176 / 255, 197 / 255)
  });

  // logo
  page.moveTo(25, height - 40);
  const logoImage = await newPdf.embedJpg(logo);
  page.drawImage(logoImage, logoImage.scale(0.13));
  page.setFontColor(rgb(255 / 255, 255 / 255, 255 / 255));
  page.setFontSize(18);
  page.drawText('Esendeo', {x: 75, y:height - 40});

  // description
  page.setFontSize(11);
  const space = 22;
  page.drawText('Facture NO: 202002170167001782', {x: 380, y:height - 40});
  page.drawText('DATE: 17/02/2020', {x: 463, y:height - 40 - space});
  page.drawText('Esendeo,Inc.', {x: 45, y:height - 65});
  page.drawText('45 avenue victor hugo', {x: 45, y:height - 65 - space});
  page.drawText('93300 Auberviliers', {x: 45, y:height - 65 - space * 2});
  page.drawText('www.esendeo.com', {x: 45, y:height - 65 - space * 3});
  page.drawText('TVA: FR44 829 348 879', {x: 45, y:height - 65 - space * 4});
  page.drawText('Siret: 829 348 879 000 18', {x: 45, y:height - 65 - space * 5});

  let nextHeight = 500;
  for(let i=0;i<100;i++){
    nextHeight = nextHeight-space;
    if(nextHeight < 0){
      page = newPdf.addPage();
      nextHeight = page.getHeight()-space;
    }
    page.moveTo(0, nextHeight);
    const color = i % 2 === 0 ?
      rgb(133 / 255, 18 / 255, 197 / 255) :
      rgb(37 / 255, 176 / 255, 197 / 255);
    page.drawRectangle({width, height: space, color});
  }

  const imageImage = await newPdf.embedJpg(wechat);
  page.drawImage(imageImage, {x: width - 115, y: 15, height: 130, width: 100});




  // Serialize the PDFDocument to Uint8Array
  return await newPdf.save();
}
