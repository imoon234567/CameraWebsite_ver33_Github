/* products.js — matches every card shown in your current catalog.html */

function formatPrice(n) {
  return `$${Number(n).toLocaleString()}`;
}

const PRODUCTS = [
  // === Items that already have data-id in your HTML ===
  {
    id: "nikon-z5-ii",
    name: "Nikon Z 5 II",
    price: 1199,
    img: "images/Nikon_Camera_4.jpg",
    blurb: "Affordable full-frame with IBIS and great IQ."
  },
  {
    id: "sony-a7iv",
    name: "Sony A7 IV",
    price: 2499,
    img: "images/Sony_A7IV.jpg",
    blurb: "Hybrid creator favorite—great autofocus and detailed 4K video."
  },
  {
    id: "fuji-x100vi",
    name: "Fujifilm X100VI",
    price: 1599,
    img: "images/Fuji_X100VI_2.webp",
    blurb: "Beloved street camera with classic styling and crisp fixed lens."
  },

  // === Cards without data-id use an id generated from the name (lowercase, spaces → '-')
  // Make sure these ids exactly match what your click handler generates.
  {
    id: "nikon-pro-dslr",
    name: "Nikon Pro DSLR",
    price: 1899,
    img: "images/Nikon_Big_DSLR_1.jpg",
    blurb: "Rugged DSLR body designed for reliability and long shoots."
  },
  {
    id: "canon-eos-1d-x-mark-iii",
    name: "Canon EOS 1D X Mark III",
    price: 6499,
    img: "images/Canon_EOS_1D_X_Mark_III.png",
    blurb: "Flagship DSLR for pros—blazing AF and durable build."
  },
  {
    id: "canon-eos-850d",
    name: "Canon EOS 850D",
    price: 899,
    img: "images/Canon_EOS_850D.png",
    blurb: "Well-rounded APS-C DSLR for learners and families."
  },
  {
    id: "canon-eos-1500d",
    name: "Canon EOS 1500D",
    price: 549,
    img: "images/Canon_EOS_1500D.png",
    blurb: "Entry-level DSLR with a 24MP sensor—easy step up from a phone."
  },
  {
    id: "canon-eos-3000d",
    name: "Canon EOS 3000D",
    price: 499,
    img: "images/Canon_EOS_3000D.png",
    blurb: "Budget DSLR for first-time shooters—simple and dependable."
  },
  {
    id: "fuji-x-t5",
    name: "Fuji X T5",
    price: 1699,
    img: "images/Fuji_X_T5.webp",
    blurb: "High-resolution APS-C mirrorless with excellent color science."
  },
  {
    id: "fuji_x_t30", // underscore kept to match your title “Fuji_X_T30”
    name: "Fuji_X_T30",
    price: 799,
    img: "images/Fuji_X_T30.jpg",
    blurb: "Compact, lightweight, and fast—great mid-budget camera."
  }
];

window.PRODUCTS = PRODUCTS;
window.formatPrice = formatPrice;
