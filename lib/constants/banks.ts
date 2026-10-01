export interface BankInfo {
  id: string;
  bin: string;
  shortName: string;
  name: string;
  logo: string;
  scheme: string;
  vietQrAppId: string;
  hasAutofill: boolean;
}

export const POPULAR_BANKS: BankInfo[] = [
  {
    id: 'vcb',
    bin: '970436',
    shortName: 'Vietcombank',
    name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    logo: 'https://api.vietqr.io/img/VCB.png',
    scheme: 'vcbdigibank://',
    vietQrAppId: 'vcb',
    hasAutofill: false,
  },
  {
    id: 'momo',
    bin: 'momo',
    shortName: 'Ví MoMo',
    name: 'Ví điện tử MoMo',
    logo: '/momo.png',
    scheme: 'momo://',
    vietQrAppId: 'momo',
    hasAutofill: false,
  },
  {
    id: 'mb',
    bin: '970422',
    shortName: 'MB Bank',
    name: 'Ngân hàng TMCP Quân đội',
    logo: 'https://api.vietqr.io/img/MB.png',
    scheme: 'mbmobile://',
    vietQrAppId: 'mb',
    hasAutofill: true,
  },
  {
    id: 'tcb',
    bin: '970407',
    shortName: 'Techcombank',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    logo: 'https://api.vietqr.io/img/TCB.png',
    scheme: 'tcb://',
    vietQrAppId: 'tcb',
    hasAutofill: false,
  },
  {
    id: 'acb',
    bin: '970416',
    shortName: 'ACB',
    name: 'Ngân hàng TMCP Á Châu',
    logo: 'https://api.vietqr.io/img/ACB.png',
    scheme: 'acbone://',
    vietQrAppId: 'acb',
    hasAutofill: true,
  },
  {
    id: 'bidv',
    bin: '970418',
    shortName: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    logo: 'https://api.vietqr.io/img/BIDV.png',
    scheme: 'bidvsmartbanking://',
    vietQrAppId: 'bidv',
    hasAutofill: true,
  },
  {
    id: 'icb',
    bin: '970415',
    shortName: 'VietinBank',
    name: 'Ngân hàng TMCP Công thương Việt Nam',
    logo: 'https://api.vietqr.io/img/ICB.png',
    scheme: 'vietinbankipay://',
    vietQrAppId: 'icb',
    hasAutofill: true,
  },
  {
    id: 'vpb',
    bin: '970432',
    shortName: 'VPBank',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    logo: 'https://api.vietqr.io/img/VPB.png',
    scheme: 'vpbankneo://',
    vietQrAppId: 'vpb',
    hasAutofill: false,
  },
  {
    id: 'tpb',
    bin: '970423',
    shortName: 'TPBank',
    name: 'Ngân hàng TMCP Tiên Phong',
    logo: 'https://api.vietqr.io/img/TPB.png',
    scheme: 'tpbank://',
    vietQrAppId: 'tpb',
    hasAutofill: false,
  },
  {
    id: 'vba',
    bin: '970405',
    shortName: 'Agribank',
    name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    logo: 'https://api.vietqr.io/img/VBA.png',
    scheme: 'agribankemobile://',
    vietQrAppId: 'vba',
    hasAutofill: false,
  },
  {
    id: 'stb',
    bin: '970403',
    shortName: 'Sacombank',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    logo: 'https://api.vietqr.io/img/STB.png',
    scheme: 'sacombankpay://',
    vietQrAppId: 'stb',
    hasAutofill: false,
  },
  {
    id: 'vib',
    bin: '970441',
    shortName: 'VIB',
    name: 'Ngân hàng TMCP Quốc tế Việt Nam',
    logo: 'https://api.vietqr.io/img/VIB.png',
    scheme: 'myvib2://',
    vietQrAppId: 'vib-2',
    hasAutofill: false,
  },
  {
    id: 'hdb',
    bin: '970437',
    shortName: 'HDBank',
    name: 'Ngân hàng TMCP Phát triển TP.HCM',
    logo: 'https://api.vietqr.io/img/HDB.png',
    scheme: 'hdbank://',
    vietQrAppId: 'hdb',
    hasAutofill: false,
  },
  {
    id: 'shb',
    bin: '970443',
    shortName: 'SHB',
    name: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
    logo: 'https://api.vietqr.io/img/SHB.png',
    scheme: 'shbsaha://',
    vietQrAppId: 'shb',
    hasAutofill: false,
  },
  {
    id: 'timo',
    bin: '963388',
    shortName: 'Timo',
    name: 'Ngân hàng số Timo by BVBank',
    logo: 'https://api.vietqr.io/img/TIMO.png',
    scheme: 'timo://',
    vietQrAppId: 'timo',
    hasAutofill: false,
  },
  {
    id: 'cake',
    bin: '546034',
    shortName: 'CAKE',
    name: 'Ngân hàng số CAKE by VPBank',
    logo: 'https://api.vietqr.io/img/CAKE.png',
    scheme: 'cake://',
    vietQrAppId: 'cake',
    hasAutofill: false,
  },
];

export function findBankByBin(bin: string): BankInfo | undefined {
  return POPULAR_BANKS.find((b) => b.bin === bin);
}

export function findBankById(id: string): BankInfo | undefined {
  return POPULAR_BANKS.find((b) => b.id.toLowerCase() === id.toLowerCase());
}
