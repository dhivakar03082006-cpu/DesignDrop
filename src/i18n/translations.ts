export type Language = 'en' | 'ta' | 'hi';

export interface TranslationDict {
  nav: {
    home: string;
    shop: string;
    studio: string;
    track: string;
    help: string;
    cart: string;
    account: string;
    designCta: string;
  };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    colorLabel: string;
    taxNote: string;
  };
  howItWorks: {
    heading: string;
    subheading: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
  };
  studio: {
    title: string;
    designArea: string;
    whereToPrint: string;
    front: string;
    back: string;
    wrap: string;
    sizeAndColor: string;
    uploadPhoto: string;
    addText: string;
    addSticker: string;
    layers: string;
    undo: string;
    redo: string;
    savedBadge: string;
    saveDesign: string;
    downloadPreview: string;
    addToCart: string;
    priceIncludesTax: string;
    getting3DReady: string;
    noWebGL: string;
  };
  common: {
    addToCart: string;
    designYours: string;
    trackMyOrder: string;
    placeOrder: string;
    payAndPlaceOrder: string;
    startShopping: string;
    needHelp: string;
    liteMode: string;
    darkMode: string;
    lightMode: string;
    language: string;
    offlineBanner: string;
    outdatedBrowser: string;
    emptyCartTitle: string;
    emptyCartDesc: string;
  };
  shopping: {
    buyNow: string;
    design: string;
    taxIncluded: string;
    taxIncludedFull: string;
    bundleBanner: string;
    bundleUnlocked: string;
    bundleNeedOne: string;
    bundleNeedTwo: string;
    bundleSavingsLabel: string;
    freeDeliveryUnlocked: string;
    freeDeliveryNeedMore: string;
    sizeGuide: string;
    sizeGuideTitle: string;
    sizeGuideSubtitle: string;
    inches: string;
    cm: string;
    howToMeasure: string;
    measureTipChest: string;
    measureTipLength: string;
    measureTipCap: string;
    checkDeliveryTitle: string;
    pincodePlaceholder: string;
    checkBtn: string;
    invalidPincode: string;
    expectedDispatch: string;
    standardDelivery: string;
    expressDelivery: string;
    freeOver599: string;
    codAvailable: string;
    recentlyViewed: string;
    recentlyViewedSub: string;
    compare: string;
    comparing: string;
    compareNow: string;
    clearAll: string;
    compareTitle: string;
    compareSubtitle: string;
    compareMaxToast: string;
    specMaterial: string;
    specPrice: string;
    specRating: string;
    specSizes: string;
    specColors: string;
    specPrintOptions: string;
    specStock: string;
    inStock: string;
    remove: string;
  };
  enhancements: {
    taxInvoiceTitle: string;
    viewGstInvoice: string;
    printInvoice: string;
    downloadPdf: string;
    basePriceBeforeTax: string;
    cgstLabel: string;
    sgstLabel: string;
    deliveryPin: string;
    grandTotalTaxIncl: string;
    safeZoneToggle: string;
    safeZoneBadge: string;
    dpiGood: string;
    dpiWarn: string;
    dpiLowTip: string;
    myDrafts: string;
    sharePreview: string;
    bulkHelperTitle: string;
    bulkSubtext: string;
    welcomeStackNote: string;
    copyCode: string;
    applyToCart: string;
    filterColor: string;
    filterRating: string;
    anyColor: string;
    anyRating: string;
    sortNewest: string;
    customPolicyTitle: string;
    standardPolicyTitle: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  en: {
    nav: {
      home: 'Home',
      shop: 'Shop',
      studio: 'Design Studio',
      track: 'Track Order',
      help: 'Help',
      cart: 'Cart',
      account: 'Account',
      designCta: 'Design Yours',
    },
    hero: {
      kicker: 'Custom T-Shirts & Mugs · Live 3D Preview',
      title: 'Design your own T-shirt or mug in minutes.',
      subtitle: 'Pick a soft shirt or ceramic mug, add your photo or text, see it in 3D right away, and get it delivered to your door.',
      primaryCta: 'Design Your T-Shirt',
      secondaryCta: 'Browse Shop',
      colorLabel: 'Try a color',
      taxNote: 'All shown prices include tax. Standard delivery is free over Rs 599.',
    },
    howItWorks: {
      heading: 'How it works in 4 simple steps',
      subheading: 'No design skills needed. Works on phones and computers.',
      step1Title: '1. Pick a product',
      step1Desc: 'Choose a cotton T-shirt, cozy hoodie, cap, or ceramic mug.',
      step2Title: '2. Add your design',
      step2Desc: 'Upload a family photo, write a name, or pick fun stickers.',
      step3Title: '3. See a live preview',
      step3Desc: 'Turn and zoom your item in 3D before you buy.',
      step4Title: '4. We print and deliver',
      step4Desc: 'We print with bright, lasting colors and ship to your door.',
    },
    studio: {
      title: 'Design Studio',
      designArea: 'Design area',
      whereToPrint: 'Where to print (front or back)',
      front: 'Front',
      back: 'Back',
      wrap: 'Full Wrap',
      sizeAndColor: 'Size and Color',
      uploadPhoto: 'Upload Photo',
      addText: 'Add Text',
      addSticker: 'Add Stickers',
      layers: 'Layers',
      undo: 'Undo',
      redo: 'Redo',
      savedBadge: 'Saved ✓',
      saveDesign: 'Save Design',
      downloadPreview: 'Download Preview',
      addToCart: 'Add to Cart',
      priceIncludesTax: 'Total includes tax (18% GST)',
      getting3DReady: 'Getting your 3D preview ready...',
      noWebGL: "3D preview isn't available on this device, but you can still design and order.",
    },
    common: {
      addToCart: 'Add to Cart',
      designYours: 'Design Your T-Shirt',
      trackMyOrder: 'Track My Order',
      placeOrder: 'Place Order',
      payAndPlaceOrder: 'Pay and Place Order',
      startShopping: 'Start Shopping',
      needHelp: 'Need help?',
      liteMode: 'Lite mode',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
      language: 'Language',
      offlineBanner: "You're offline. Please check your internet.",
      outdatedBrowser: 'Your browser is out of date. For the best experience, please update it.',
      emptyCartTitle: 'Your cart is empty.',
      emptyCartDesc: "Let's find something you'll love.",
    },
    shopping: {
      buyNow: 'Buy Now',
      design: 'Design',
      taxIncluded: '18% GST incl.',
      taxIncludedFull: 'Price includes 18% GST tax',
      bundleBanner: 'Buy 2 T-Shirts or Mugs, Save 10% automatically',
      bundleUnlocked: '10% Bundle Offer applied!',
      bundleNeedOne: 'Add 1 more T-shirt or mug to save 10%!',
      bundleNeedTwo: 'Buy any 2 T-shirts or mugs to save 10%',
      bundleSavingsLabel: 'Bundle offer (10% off)',
      freeDeliveryUnlocked: 'You unlocked FREE standard delivery!',
      freeDeliveryNeedMore: 'more for FREE delivery',
      sizeGuide: 'Size & Fit Guide',
      sizeGuideTitle: 'Size & Fit Guide',
      sizeGuideSubtitle: 'Simple measurements so your T-shirt, hoodie, or cap fits just right.',
      inches: 'Inches',
      cm: 'cm',
      howToMeasure: 'Easy way to measure at home',
      measureTipChest: 'Chest: Measure flat across your favorite shirt, just below the sleeves, then double it.',
      measureTipLength: 'Length: Measure straight down from the top shoulder seam to the bottom edge.',
      measureTipCap: 'Cap fit: Wrap a soft tape around your head just above your ears. Adjustable strap fits most.',
      checkDeliveryTitle: 'Check Delivery Date',
      pincodePlaceholder: 'Enter 6-digit PIN code (e.g. 600001)',
      checkBtn: 'Check',
      invalidPincode: 'Please enter a valid 6-digit Indian PIN code.',
      expectedDispatch: 'Prints & ships by',
      standardDelivery: 'Standard delivery',
      expressDelivery: 'Express delivery (Rs 149)',
      freeOver599: 'Free over Rs 599',
      codAvailable: 'Cash on Delivery available',
      recentlyViewed: 'Recently Viewed',
      recentlyViewedSub: 'Pick up right where you left off',
      compare: 'Compare',
      comparing: 'Added',
      compareNow: 'Compare Now',
      clearAll: 'Clear',
      compareTitle: 'Compare Items Side by Side',
      compareSubtitle: 'Compare up to 3 items — material, GST-inclusive price, ratings, and print options.',
      compareMaxToast: 'You can compare up to 3 items at a time. Remove one first.',
      specMaterial: 'Material / Size',
      specPrice: 'Price (18% GST incl.)',
      specRating: 'Customer Rating',
      specSizes: 'Available Sizes',
      specColors: 'Color Options',
      specPrintOptions: 'Print Options',
      specStock: 'Availability',
      inStock: 'Ready to print',
      remove: 'Remove',
    },
    enhancements: {
      taxInvoiceTitle: 'GST Tax Invoice',
      viewGstInvoice: 'View GST Invoice',
      printInvoice: 'Print',
      downloadPdf: 'Download PDF',
      basePriceBeforeTax: 'Base price (before GST)',
      cgstLabel: 'CGST (9%)',
      sgstLabel: 'SGST (9%)',
      deliveryPin: 'Delivery PIN',
      grandTotalTaxIncl: 'Grand Total (18% GST incl.)',
      safeZoneToggle: 'Safe Print Guide',
      safeZoneBadge: 'Safe Print Area · 300 DPI',
      dpiGood: 'Print Quality: Sharp (300 DPI ready)',
      dpiWarn: 'Low Photo Quality',
      dpiLowTip: 'This photo may look slightly soft when printed large. Try a sharper photo or shrink it inside the box.',
      myDrafts: 'My Drafts',
      sharePreview: 'Share Preview',
      bulkHelperTitle: 'Team / Bulk Order Helper',
      bulkSubtext: 'Ordering 5–20+ for a team, family, or event? Pick quantities quickly below.',
      welcomeStackNote: 'WELCOME10 (10% off orders Rs 499+) stacks right on top of our "Buy 2 T-Shirts or Mugs, Save 10%" bundle offer!',
      copyCode: 'Copy Code',
      applyToCart: 'Apply to Cart',
      filterColor: 'Color',
      filterRating: 'Rating',
      anyColor: 'Any Color',
      anyRating: 'Any Rating',
      sortNewest: 'Newest Arrivals',
      customPolicyTitle: 'Custom-Printed Items (Your Photo or Text)',
      standardPolicyTitle: 'Standard Blank Store Items',
    },
  },
  ta: {
    nav: {
      home: 'முகப்பு',
      shop: 'கடை',
      studio: 'வடிவமைப்பு',
      track: 'ஆர்டர் நிலை',
      help: 'உதவி',
      cart: 'கூடை',
      account: 'கணக்கு',
      designCta: 'இப்போதே வடிவமை',
    },
    hero: {
      kicker: 'தனிப்பயன் டீ-ஷர்ட் & மக் · நேரடி 3D காட்சி',
      title: 'சில நிமிடங்களில் உங்கள் டீ-ஷர்ட் அல்லது மக்கை வடிவமையுங்கள்.',
      subtitle: 'மென்மையான டீ-ஷர்ட் அல்லது மக்கைத் தேர்ந்தெடுத்து, புகைப்படம் அல்லது எழுத்தைச் சேர்த்து 3D-யில் பார்த்து ஆர்டர் செய்யுங்கள்.',
      primaryCta: 'டீ-ஷர்ட் வடிவமை',
      secondaryCta: 'பொருட்களைப் பார்',
      colorLabel: 'நிறத்தைத் தேர்ந்தெடு',
      taxNote: 'காட்டப்படும் விலையில் வரி சேர்க்கப்பட்டுள்ளது. ரூ 599-க்கு மேல் இலவச டெலிவரி.',
    },
    howItWorks: {
      heading: '4 எளிய படிகளில் செயல்படும் விதம்',
      subheading: 'முன் அனுபவம் தேவையில்லை. போனிலும் கணினியிலும் எளிதாகப் பயன்படுத்தலாம்.',
      step1Title: '1. பொருளைத் தேர்ந்தெடு',
      step1Desc: 'பருத்தி டீ-ஷர்ட், ஹூடி, தொப்பி அல்லது செராமிக் மக்கைத் தேர்ந்தெடுக்கவும்.',
      step2Title: '2. உங்கள் வடிவத்தைச் சேர்',
      step2Desc: 'புகைப்படம், பெயர் அல்லது ஸ்டிக்கர்களை எளிதாகச் சேர்க்கவும்.',
      step3Title: '3. நேரடி 3D காட்சியைப் பார்',
      step3Desc: 'வாங்கும் முன் 3D-யில் சுழற்றிப் பார்த்து உறுதி செய்யுங்கள்.',
      step4Title: '4. அச்சிட்டு வீடு தேடி அனுப்புவோம்',
      step4Desc: 'தரமான அச்சுடன் உங்கள் வீட்டு முகவரிக்கு விரைவாக அனுப்புவோம்.',
    },
    studio: {
      title: 'வடிவமைப்பு கூடம்',
      designArea: 'வடிவமைப்பு பகுதி',
      whereToPrint: 'அச்சிடும் இடம் (முன் / பின்)',
      front: 'முன்புறம்',
      back: 'பின்புறம்',
      wrap: 'முழு சுற்றளவு',
      sizeAndColor: 'அளவு மற்றும் நிறம்',
      uploadPhoto: 'புகைப்படம் சேர்',
      addText: 'எழுத்து சேர்',
      addSticker: 'ஸ்டிக்கர் சேர்',
      layers: 'அடுக்குகள்',
      undo: 'பின்செல்',
      redo: 'முன்செல்',
      savedBadge: 'சேமிக்கப்பட்டது ✓',
      saveDesign: 'வடிவத்தைச் சேமி',
      downloadPreview: 'படத்தை பதிவிறக்கு',
      addToCart: 'கூடையில் சேர்',
      priceIncludesTax: 'மொத்த விலையில் வரி (18% GST) அடங்கும்',
      getting3DReady: 'உங்கள் 3D காட்சி தயாராகிறது...',
      noWebGL: 'இந்த சாதனத்தில் 3D காட்சி இயங்கவில்லை, ஆனால் நீங்கள் வடிவமைத்து ஆர்டர் செய்யலாம்.',
    },
    common: {
      addToCart: 'கூடையில் சேர்',
      designYours: 'டீ-ஷர்ட் வடிவமை',
      trackMyOrder: 'ஆர்டரைக் கண்காணி',
      placeOrder: 'ஆர்டர் செய்',
      payAndPlaceOrder: 'பணம் செலுத்தி ஆர்டர் செய்',
      startShopping: 'ஷாப்பிங் தொடங்கு',
      needHelp: 'உதவி தேவையா?',
      liteMode: 'எளிய முறை',
      darkMode: 'இருள் தோற்றம்',
      lightMode: 'ஒளி தோற்றம்',
      language: 'மொழி',
      offlineBanner: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். இணையத்தைச் சரிபார்க்கவும்.',
      outdatedBrowser: 'உங்கள் உலாவி பழையதாக உள்ளது. சிறந்த அனுபவத்திற்குப் புதுப்பிக்கவும்.',
      emptyCartTitle: 'உங்கள் கூடை காலியாக உள்ளது.',
      emptyCartDesc: 'உங்களுக்குப் பிடித்த பொருளைத் தேர்ந்தெடுப்போம்.',
    },
    shopping: {
      buyNow: 'இப்போதே வாங்கு',
      design: 'வடிவமை',
      taxIncluded: '18% GST அடங்கும்',
      taxIncludedFull: 'விலையில் 18% GST வரி அடங்கும்',
      bundleBanner: '2 டீ-ஷர்ட் அல்லது மக் வாங்கினால் 10% தள்ளுபடி',
      bundleUnlocked: '10% தொகுப்பு சலுகை சேர்க்கப்பட்டது!',
      bundleNeedOne: '10% சேமிக்க இன்னும் 1 டீ-ஷர்ட் அல்லது மக் சேர்க்கவும்!',
      bundleNeedTwo: 'ஏதேனும் 2 டீ-ஷர்ட் அல்லது மக் வாங்கி 10% சேமிக்கவும்',
      bundleSavingsLabel: 'தொகுப்பு சலுகை (10% தள்ளுபடி)',
      freeDeliveryUnlocked: 'இலவச டெலிவரி கிடைத்துவிட்டது!',
      freeDeliveryNeedMore: 'மேலும் சேர்த்தால் இலவச டெலிவரி',
      sizeGuide: 'அளவு வழிகாட்டி',
      sizeGuideTitle: 'அளவு மற்றும் பொருத்த வழிகாட்டி',
      sizeGuideSubtitle: 'டீ-ஷர்ட், ஹூடி மற்றும் தொப்பிக்கு சரியான அளவை எளிதாகத் தேர்ந்தெடுங்கள்.',
      inches: 'இன்ச்',
      cm: 'செ.மீ',
      howToMeasure: 'வீட்டிலேயே அளவிடும் எளிய முறை',
      measureTipChest: 'மார்பளவு: உங்களுக்குப் பிடித்த சட்டையை விரித்து, கைக்குக் கீழ் அளந்து அதை இரட்டிப்பாக்கவும்.',
      measureTipLength: 'நீளம்: தோள்பட்டை மேற்பகுதியில் இருந்து கீழ் விளிம்பு வரை நேராக அளக்கவும்.',
      measureTipCap: 'தொப்பி அளவு: காதுகளுக்கு மேல் தலையைச் சுற்றி அளக்கவும். பின்புற பட்டை சரிசெய்யக்கூடியது.',
      checkDeliveryTitle: 'டெலிவரி தேதியைச் சரிபார்',
      pincodePlaceholder: '6 இலக்க பின் கோடு (எ.கா. 600001)',
      checkBtn: 'சரிபார்',
      invalidPincode: 'சரியான 6 இலக்க இந்திய பின் கோடை உள்ளிடவும்.',
      expectedDispatch: 'அச்சிட்டு அனுப்பும் தேதி',
      standardDelivery: 'சாதாரண டெலிவரி',
      expressDelivery: 'விரைவு டெலிவரி (ரூ 149)',
      freeOver599: 'ரூ 599-க்கு மேல் இலவசம்',
      codAvailable: 'பொருள் வந்ததும் பணம் செலுத்தலாம் (COD)',
      recentlyViewed: 'சமீபத்தில் பார்த்தவை',
      recentlyViewedSub: 'நீங்கள் பார்த்த பொருட்களை மீண்டும் பாருங்கள்',
      compare: 'ஒப்பிடு',
      comparing: 'சேர்ந்தது',
      compareNow: 'ஒப்பிட்டுப் பார்',
      clearAll: 'நீக்கு',
      compareTitle: 'பொருட்களை அருகருகே ஒப்பிடுங்கள்',
      compareSubtitle: '3 பொருட்கள் வரை ஒப்பிடலாம் — துணி தரம், GST விலை, மதிப்பீடு மற்றும் அச்சு விருப்பங்கள்.',
      compareMaxToast: 'ஒரே நேரத்தில் 3 பொருட்கள் வரை மட்டுமே ஒப்பிட முடியும்.',
      specMaterial: 'பொருள் / தரம்',
      specPrice: 'விலை (18% GST)',
      specRating: 'வாடிக்கையாளர் மதிப்பீடு',
      specSizes: 'கிடைக்கும் அளவுகள்',
      specColors: 'நிறங்கள்',
      specPrintOptions: 'அச்சு விருப்பங்கள்',
      specStock: 'கையிருப்பு',
      inStock: 'அச்சிடத் தயார்',
      remove: 'நீக்கு',
    },
    enhancements: {
      taxInvoiceTitle: 'GST வரி ரசீது (Invoice)',
      viewGstInvoice: 'GST ரசீதைப் பார்',
      printInvoice: 'அச்சிடு',
      downloadPdf: 'PDF பதிவிறக்கு',
      basePriceBeforeTax: 'அடிப்படை விலை (GST முன்பு)',
      cgstLabel: 'CGST (9%)',
      sgstLabel: 'SGST (9%)',
      deliveryPin: 'டெலிவரி PIN',
      grandTotalTaxIncl: 'மொத்த தொகை (18% GST அடங்கும்)',
      safeZoneToggle: 'பாதுகாப்பு அச்சு எல்லை',
      safeZoneBadge: 'பாதுகாப்பு அச்சு பகுதி · 300 DPI',
      dpiGood: 'அச்சு தரம்: தெளிவானது (300 DPI)',
      dpiWarn: 'குறைந்த தெளிவு படம்',
      dpiLowTip: 'இந்தப் படம் பெரிதாக அச்சிடும்போது சற்று மங்கலாகலாம். தெளிவான படத்தைப் பயன்படுத்தவும் அல்லது அளவைச் சிறிதாக்கவும்.',
      myDrafts: 'என் வரைவுகள்',
      sharePreview: 'பகிர்',
      bulkHelperTitle: 'குழு / மொத்த ஆர்டர் உதவி',
      bulkSubtext: 'குழு அல்லது நிகழ்வுக்கு 5–20+ ஆர்டர் செய்கிறீர்களா? கீழே எண்ணிக்கையை எளிதாகத் தேர்ந்தெடுக்கவும்.',
      welcomeStackNote: 'WELCOME10 (ரூ 499+ ஆர்டர்களுக்கு 10% தள்ளுபடி) சலுகை, 2 டீ-ஷர்ட்/மக் 10% தொகுப்பு சலுகையுடன் சேர்த்தும் பயன்படுத்தலாம்!',
      copyCode: 'குறியீட்டை நகலெடு',
      applyToCart: 'கூடையில் சேர்',
      filterColor: 'நிறம்',
      filterRating: 'மதிப்பீடு',
      anyColor: 'எந்த நிறமும்',
      anyRating: 'எந்த மதிப்பீடும்',
      sortNewest: 'புதிய வரவுகள்',
      customPolicyTitle: 'தனிப்பயன் அச்சு பொருட்கள் (உங்கள் படம் / பெயர்)',
      standardPolicyTitle: 'சாதாரண கடை பொருட்கள்',
    },
  },
  hi: {
    nav: {
      home: 'होम',
      shop: 'शॉप',
      studio: 'डिज़ाइन स्टूडियो',
      track: 'ऑर्डर ट्रैक',
      help: 'मदद',
      cart: 'कार्ट',
      account: 'खाता',
      designCta: 'खुद डिज़ाइन करें',
    },
    hero: {
      kicker: 'कस्टम टी-शर्ट और मग · लाइव 3D प्रीव्यू',
      title: 'मिनटों में अपनी टी-शर्ट या मग खुद डिज़ाइन करें।',
      subtitle: 'नरम टी-शर्ट या मग चुनें, फोटो या नाम जोड़ें, 3D में तुरंत देखें और घर पर डिलीवरी पाएं।',
      primaryCta: 'टी-शर्ट डिज़ाइन करें',
      secondaryCta: 'शॉप देखें',
      colorLabel: 'रंग बदलकर देखें',
      taxNote: 'सभी कीमतों में टैक्स शामिल है। ₹599 से ऊपर मुफ़्त डिलीवरी।',
    },
    howItWorks: {
      heading: '4 आसान चरणों में कैसे काम करता है',
      subheading: 'किसी डिज़ाइन अनुभव की जरूरत नहीं। फोन और कंप्यूटर दोनों पर आसान।',
      step1Title: '1. प्रोडक्ट चुनें',
      step1Desc: 'कॉटन टी-शर्ट, हुडी, कैप या सिरेमिक मग चुनें।',
      step2Title: '2. अपना डिज़ाइन जोड़ें',
      step2Desc: 'फोटो अपलोड करें, नाम लिखें या स्टिकर लगाएं।',
      step3Title: '3. लाइव 3D प्रीव्यू देखें',
      step3Desc: 'खरीदने से पहले अपने आइटम को 3D में घुमाकर देखें।',
      step4Title: '4. हम प्रिंट करके भेजते हैं',
      step4Desc: 'चमकदार प्रिंट के साथ हम आपके घर तक पहुंचाते हैं।',
    },
    studio: {
      title: 'डिज़ाइन स्टूडियो',
      designArea: 'डिज़ाइन क्षेत्र',
      whereToPrint: 'प्रिंट कहां करें (आगे या पीछे)',
      front: 'आगे',
      back: 'पीछे',
      wrap: 'पूरा चारों ओर',
      sizeAndColor: 'साइज़ और रंग',
      uploadPhoto: 'फोटो अपलोड करें',
      addText: 'टेक्स्ट जोड़ें',
      addSticker: 'स्टिकर जोड़ें',
      layers: 'लेयर्स',
      undo: 'वापस जाएं',
      redo: 'फिर से करें',
      savedBadge: 'सेव हो गया ✓',
      saveDesign: 'डिज़ाइन सेव करें',
      downloadPreview: 'प्रीव्यू डाउनलोड करें',
      addToCart: 'कार्ट में जोड़ें',
      priceIncludesTax: 'कुल कीमत में टैक्स (18% GST) शामिल है',
      getting3DReady: 'आपका 3D प्रीव्यू तैयार हो रहा है...',
      noWebGL: 'इस डिवाइस पर 3D प्रीव्यू उपलब्ध नहीं है, लेकिन आप फिर भी डिज़ाइन और ऑर्डर कर सकते हैं।',
    },
    common: {
      addToCart: 'कार्ट में जोड़ें',
      designYours: 'टी-शर्ट डिज़ाइन करें',
      trackMyOrder: 'मेरा ऑर्डर ट्रैक करें',
      placeOrder: 'ऑर्डर करें',
      payAndPlaceOrder: 'भुगतान करें और ऑर्डर दें',
      startShopping: 'शॉपिंग शुरू करें',
      needHelp: 'मदद चाहिए?',
      liteMode: 'लाइट मोड',
      darkMode: 'डार्क मोड',
      lightMode: 'लाइट मोड',
      language: 'भाषा',
      offlineBanner: 'आप ऑफ़लाइन हैं। कृपया अपना इंटरनेट जांचें।',
      outdatedBrowser: 'आपका ब्राउज़र पुराना है। बेहतर अनुभव के लिए कृपया इसे अपडेट करें।',
      emptyCartTitle: 'आपका कार्ट खाली है।',
      emptyCartDesc: 'आइए आपके लिए कुछ खास ढूंढते हैं।',
    },
    shopping: {
      buyNow: 'अभी खरीदें',
      design: 'डिज़ाइन',
      taxIncluded: '18% GST शामिल',
      taxIncludedFull: 'कीमत में 18% GST टैक्स शामिल है',
      bundleBanner: '2 टी-शर्ट या मग खरीदें, 10% अपने-आप बचाएं',
      bundleUnlocked: '10% बंडल छूट लागू हो गई!',
      bundleNeedOne: '10% बचाने के लिए 1 और टी-शर्ट या मग जोड़ें!',
      bundleNeedTwo: 'कोई भी 2 टी-शर्ट या मग लेकर 10% बचाएं',
      bundleSavingsLabel: 'बंडल छूट (10% ऑफ)',
      freeDeliveryUnlocked: 'आपको मुफ़्त स्टैंडर्ड डिलीवरी मिल गई!',
      freeDeliveryNeedMore: 'और जोड़ें मुफ़्त डिलीवरी के लिए',
      sizeGuide: 'साइज़ गाइड',
      sizeGuideTitle: 'साइज़ और फिट गाइड',
      sizeGuideSubtitle: 'आसान नाप ताकि आपकी टी-शर्ट, हुडी या कैप एकदम सही फिट आए।',
      inches: 'इंच',
      cm: 'सेमी',
      howToMeasure: 'घर पर नापने का आसान तरीका',
      measureTipChest: 'छाती: अपनी पसंदीदा शर्ट को सीधा बिछाकर बांहों के नीचे से नापें और दोगुना करें।',
      measureTipLength: 'लंबाई: कंधे के ऊपर से नीचे के किनारे तक सीधा नापें।',
      measureTipCap: 'कैप साइज़: कानों के ठीक ऊपर सिर के चारों ओर नापें। पीछे का स्ट्रैप एडजस्ट होता है।',
      checkDeliveryTitle: 'डिलीवरी तारीख जांचें',
      pincodePlaceholder: '6 अंकों का पिन कोड लिखें (जैसे 110001)',
      checkBtn: 'जांचें',
      invalidPincode: 'कृपया सही 6 अंकों का भारतीय पिन कोड डालें।',
      expectedDispatch: 'प्रिंट और डिस्पैच',
      standardDelivery: 'स्टैंडर्ड डिलीवरी',
      expressDelivery: 'एक्सप्रेस डिलीवरी (Rs 149)',
      freeOver599: 'Rs 599 से ऊपर मुफ़्त',
      codAvailable: 'कैश ऑन डिलीवरी उपलब्ध',
      recentlyViewed: 'हाल ही में देखे गए',
      recentlyViewedSub: 'जहां छोड़ा था वहीं से जारी रखें',
      compare: 'तुलना करें',
      comparing: 'जुड़ा हुआ',
      compareNow: 'तुलना देखें',
      clearAll: 'हटाएं',
      compareTitle: 'आइटम्स की तुलना करें',
      compareSubtitle: '3 आइटम तक तुलना करें — मटेरियल, GST कीमत, रेटिंग और प्रिंट विकल्प।',
      compareMaxToast: 'आप एक साथ केवल 3 आइटम की तुलना कर सकते हैं। पहले एक हटाएं।',
      specMaterial: 'मटेरियल / क्षमता',
      specPrice: 'कीमत (18% GST शामिल)',
      specRating: 'ग्राहक रेटिंग',
      specSizes: 'उपलब्ध साइज़',
      specColors: 'रंग के विकल्प',
      specPrintOptions: 'प्रिंट विकल्प',
      specStock: 'उपलब्धता',
      inStock: 'प्रिंट के लिए तैयार',
      remove: 'हटाएं',
    },
    enhancements: {
      taxInvoiceTitle: 'GST टैक्स इनवॉइस',
      viewGstInvoice: 'GST इनवॉइस देखें',
      printInvoice: 'प्रिंट करें',
      downloadPdf: 'PDF डाउनलोड करें',
      basePriceBeforeTax: 'बेस कीमत (GST से पहले)',
      cgstLabel: 'CGST (9%)',
      sgstLabel: 'SGST (9%)',
      deliveryPin: 'डिलीवरी PIN',
      grandTotalTaxIncl: 'कुल राशि (18% GST शामिल)',
      safeZoneToggle: 'सेफ प्रिंट गाइड',
      safeZoneBadge: 'सेफ प्रिंट एरिया · 300 DPI',
      dpiGood: 'प्रिंट क्वालिटी: शार्प (300 DPI)',
      dpiWarn: 'कम क्वालिटी फोटो',
      dpiLowTip: 'बड़ा प्रिंट करने पर यह फोटो थोड़ी धुंधली दिख सकती है। बेहतर फोटो अपलोड करें या साइज़ छोटा करें।',
      myDrafts: 'मेरे ड्राफ्ट्स',
      sharePreview: 'प्रीव्यू शेयर करें',
      bulkHelperTitle: 'टीम / बल्क ऑर्डर हेल्पर',
      bulkSubtext: 'टीम, परिवार या इवेंट के लिए 5–20+ ऑर्डर कर रहे हैं? नीचे से आसानी से संख्या चुनें।',
      welcomeStackNote: 'WELCOME10 (Rs 499+ पर 10% छूट) हमारे "2 टी-शर्ट या मग लें, 10% बचाएं" बंडल ऑफर के साथ भी काम करता है!',
      copyCode: 'कोड कॉपी करें',
      applyToCart: 'कार्ट में लगाएं',
      filterColor: 'रंग',
      filterRating: 'रेटिंग',
      anyColor: 'कोई भी रंग',
      anyRating: 'कोई भी रेटिंग',
      sortNewest: 'नए प्रोडक्ट्स',
      customPolicyTitle: 'कस्टम-प्रिंट आइटम्स (आपकी फोटो या नाम)',
      standardPolicyTitle: 'स्टैंडर्ड ब्लैंक स्टोर आइटम्स',
    },
  },
};
