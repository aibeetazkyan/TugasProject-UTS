// Tombol ubah tema
// Theme handling (persisted)
const Theme = (function() {
  const KEY = 'site-theme'; 
  function get() { return localStorage.getItem(KEY) || 'light'; }
  function set(value) { localStorage.setItem(KEY, value); apply(value); }
  function apply(value) {
    if (value === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    const btn = document.getElementById('toggleTheme');
    if (btn) btn.textContent = value === 'dark' ? 'Mode Terang' : 'Ubah Tema';
  }
  return { get, set, apply };
})();

document.addEventListener('DOMContentLoaded', () => {
  Theme.apply(Theme.get());
  document.getElementById('toggleTheme')?.addEventListener('click', function() {
    const next = Theme.get() === 'dark' ? 'light' : 'dark';
    Theme.set(next);
  });
});

// Validasi form kontak
document.getElementById("contactForm")?.addEventListener("submit", function(event) {
  event.preventDefault();
  alert("Pesan berhasil dikirim!");
  this.reset(); 
});

// Mode gelap CSS tambahan
const style = document.createElement('style');
style.textContent = `
  .dark-mode {
    background-color: #222;
    color: white;
  }
  .dark-mode .header {
    background-color: #333;
  }
  .dark-mode .footer {
    background-color: #444;
  }
`;
document.head.appendChild(style);

// Unified cart system
const Cart = (function() {
  const STORAGE_KEY = 'cart';

  function load() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function save(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function add(item) {
    const cart = load();
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.push(Object.assign({ quantity: 1 }, item));
    }
    save(cart);
  }

  function remove(index) {
    const cart = load();
    cart.splice(index, 1);
    save(cart);
  }

  function updateQuantity(index, qty) {
    const cart = load();
    if (!cart[index]) return;
    cart[index].quantity = qty;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    save(cart);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    updateCartCount();
  }

  function totalItems() {
    return load().reduce((s, i) => s + (i.quantity || 0), 0);
  }

  function updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const count = totalItems();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  return { load, save, add, remove, updateQuantity, clear, updateCartCount };
})();

// Attach add-to-cart handlers and initialize cart badge
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateCartCount();

  document.querySelectorAll('.product-card .add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const id = card.dataset.id || card.querySelector('.card-title')?.innerText;
      const name = card.dataset.name || card.querySelector('.card-title')?.innerText;
      const price = parseInt(card.dataset.price || (card.dataset.priceDisplay || '').replace(/[^\d]/g, '')) || 0;
      const priceDisplay = card.dataset.priceDisplay || card.querySelector('.card-text')?.innerText || '';
      const image = card.dataset.image || card.querySelector('img')?.src || '';

      Cart.add({ id, name, price, priceDisplay, image, quantity: 1 });

      btn.textContent = 'Ditambahkan';
      setTimeout(() => btn.textContent = 'Tambah ke Keranjang', 900);

      showToast(`${name} ditambahkan ke keranjang`);
    });
  });

  // Cart rendering and controls
  const cartTable = document.getElementById('cart-items');
  const totalPriceElement = document.getElementById('total-price');
  const clearCartBtn = document.getElementById('clear-cart');

  // menampilkan isi keranjang
  function renderCart() {
    if (!cartTable || !totalPriceElement) return;
    const cart = Cart.load();
    cartTable.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
      cartTable.innerHTML = `<tr><td colspan="6">Keranjang kosong 😢</td></tr>`;
      totalPriceElement.textContent = 'Total: Rp0';
      return;
    }

    cart.forEach((item, index) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      total += itemTotal;
      const row = `
        <tr>
          <td><img src="${item.image}" width="100" alt="${item.name}"></td>
          <td>${item.name}</td>
          <td>${item.priceDisplay || ('Rp' + (item.price || 0).toLocaleString('id-ID'))}</td>
          <td>
            <div class="input-group input-group-sm" style="width:120px">
              <button class="btn btn-outline-secondary minus" data-index="${index}" type="button">-</button>
              <input type="text" class="form-control text-center qty-input" value="${item.quantity}" data-index="${index}" />
              <button class="btn btn-outline-secondary plus" data-index="${index}" type="button">+</button>
            </div>
          </td>
          <td>Rp${itemTotal.toLocaleString('id-ID')}</td>
          <td><button class="btn btn-sm btn-danger delete" data-index="${index}">Hapus</button></td>
        </tr>
      `;
      cartTable.insertAdjacentHTML('beforeend', row);
    });

    totalPriceElement.textContent = `Total: Rp${total.toLocaleString('id-ID')}`;
  }

  // Delegated events for cart controls
  cartTable?.addEventListener('click', (e) => {
    const index = e.target.dataset.index;
    if (e.target.classList.contains('minus')) {
      const cart = Cart.load();
      const qty = Math.max(1, (cart[index].quantity || 1) - 1);
      Cart.updateQuantity(index, qty);
      renderCart();
    } else if (e.target.classList.contains('plus')) {
      const cart = Cart.load();
      const qty = (cart[index].quantity || 0) + 1;
      Cart.updateQuantity(index, qty);
      renderCart();
    } else if (e.target.classList.contains('delete')) {
      if (confirm('Hapus item ini dari keranjang?')) {
        Cart.remove(index);
        renderCart();
      }
    }
  });

  cartTable?.addEventListener('change', (e) => {
    if (e.target.classList.contains('qty-input')) {
      const idx = e.target.dataset.index;
      const v = parseInt(e.target.value) || 0;
      Cart.updateQuantity(idx, v);
      renderCart();
    }
  });

  clearCartBtn?.addEventListener('click', () => {
    if (confirm('Apakah kamu yakin ingin menghapus semua item di keranjang?')) {
      Cart.clear();
      renderCart();
    }
  });

  // Re-render when offcanvas opens to show fresh data
  const cartOffcanvasEl = document.getElementById('cartOffcanvas');
  if (cartOffcanvasEl) {
    cartOffcanvasEl.addEventListener('show.bs.offcanvas', () => renderCart());
  }

  // initial render
  renderCart();
});

// Toast helper
function showToast(message) {
  const toastEl = document.getElementById('liveToast');
  const toastBody = document.getElementById('toast-body');
  if (!toastEl || !toastBody) return;
  toastBody.textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// Checkout handlers (pada keranjang.html)
document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkout-btn');
  const confirmCheckout = document.getElementById('confirm-checkout');
  const checkoutSummary = document.getElementById('checkout-summary');
  const checkoutModalEl = document.getElementById('checkoutModal');
  const checkoutForm = document.getElementById('checkout-form');

  function buildSummary() {
    const cart = Cart.load();
    if (!checkoutSummary) return;
    if (cart.length === 0) {
      checkoutSummary.innerHTML = '<p>Keranjang kosong.</p>';
      return;
    }
    let html = '<ul class="list-group">';
    let total = 0;
    cart.forEach(i => {
      const sub = (i.price || 0) * (i.quantity || 0);
      total += sub;
      html += `<li class="list-group-item d-flex justify-content-between align-items-center">${i.name} <span>Rp${sub.toLocaleString('id-ID')}</span></li>`;
    });
    html += `</ul><div class="mt-3"><strong>Total: Rp${total.toLocaleString('id-ID')}</strong></div>`;
    checkoutSummary.innerHTML = html;
  }

  if (checkoutBtn && checkoutModalEl) {
    checkoutBtn.addEventListener('click', () => {
      buildSummary();
      const modal = new bootstrap.Modal(checkoutModalEl);
      modal.show();
    });
  }

  if (confirmCheckout) {
    confirmCheckout.addEventListener('click', () => {
      if (checkoutForm && !checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
      }
      // simulate checkout success
      const name = document.getElementById('customerName')?.value || 'Pelanggan';
      Cart.clear();
      // re-render cart UI if present
      document.getElementById('cart-items') && (function(){
        const evt = new Event('DOMContentLoaded');
        document.dispatchEvent(evt);
      })();
      showToast(`Terima kasih ${name}, pesanan Anda berhasil.`);
      // hide modal
      const modalEl = bootstrap.Modal.getInstance(checkoutModalEl);
      if (modalEl) modalEl.hide();
    });
  }
});