import assert from "node:assert/strict";
import test from "node:test";

import {
  addCartItem,
  buildCartWhatsAppMessage,
  getCartTotals,
  normalizeQuantity,
  parseStoredCart,
  removeCartItem,
  updateCartItemQuantity,
  type CartProductSnapshot,
} from "../src/lib/cart-core.ts";

const texapon: CartProductSnapshot = {
  id: "TEX-1000",
  slug: "texapon-70-1000g",
  nombre: "Texapon 70",
  presentacion: "1.000 g",
  precio: 15000,
  imagen: "/productos/texapon-70-1000g.png",
};

const argan: CartProductSnapshot = {
  id: "ARG-1000",
  slug: "aceite-de-argan-1000g",
  nombre: "Aceite de argán",
  presentacion: "1 kg",
  precio: 200000,
  imagen: "/productos/aceite-de-argan-1000g.png",
};

test("normaliza cantidades inválidas", () => {
  assert.equal(normalizeQuantity(0), 1);
  assert.equal(normalizeQuantity(-8), 1);
  assert.equal(normalizeQuantity(3.9), 3);
  assert.equal(normalizeQuantity(1500), 999);
});

test("añade productos y acumula cantidades", () => {
  const one = addCartItem([], texapon, 2);
  const two = addCartItem(one, texapon, 3);
  const three = addCartItem(two, argan, 1);

  assert.equal(two[0].quantity, 5);
  assert.equal(three.length, 2);
  assert.deepEqual(getCartTotals(three), {
    totalItems: 6,
    total: 275000,
    hasPendingPrices: false,
  });
});

test("actualiza, elimina y parsea carrito persistido", () => {
  const items = addCartItem([], texapon, 2);
  const updated = updateCartItemQuantity(items, "TEX-1000", 7);
  const parsed = parseStoredCart(JSON.stringify(updated));

  assert.equal(parsed[0].quantity, 7);
  assert.equal(removeCartItem(parsed, "TEX-1000").length, 0);
  assert.deepEqual(parseStoredCart("no-json"), []);
});

test("genera mensaje de WhatsApp con subtotales y total", () => {
  const message = buildCartWhatsAppMessage([addCartItem([], texapon, 2)[0], addCartItem([], argan, 1)[0]]);

  assert.match(message, /Hola, quiero solicitar/);
  assert.match(message, /Texapon 70/);
  assert.match(message, /Cantidad: 2/);
  assert.match(message, /Total estimado:/);
  assert.match(message, /\$[\s\u00a0]?230\.000/);
});
