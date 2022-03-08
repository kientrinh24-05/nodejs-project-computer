const eleCartContent = document.querySelector("#cart-content");

const eleMiniCartItems = document.querySelector("#mini-cart-items");
const eleCartListMain = document.querySelector("#cart-list-main");
const eleCartListAlert = document.querySelector("#cart-list-alert");
const eleCartListTotal = document.querySelector("#cart-list-total");
const eleCartCheckoutTotal = document.querySelector("#checkout-total");
const eleAddToCarts = document.querySelectorAll(".add-cart");
let eleRemoveMiniCartItem = document.querySelectorAll(".remove-mini-cart-item");
const eleCartCountItem = document.querySelectorAll(".cart-count-item");
const eleTotal = document.querySelector("#header_cart-total");
const qty = document.querySelector("#product-qty");

const cartCheckout = document.querySelector("#cart-checkout");
let typeCheckout = 1;

class Cart {
  constructor() {
    this.cart = localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
    this.total = this.cart && this.cart.length > 0 ? this.getTotal() : 0;
    this.addTocart();
    this.renderCartHeader();
    this.renderCartMain();
    this.checkOut();
  }

  getTotal() {
    let total = 0;
    this.cart.forEach((item) => (total += item.price * item.qty));
    return total;
  }

  renderCartHeader() {
    if (eleMiniCartItems) {
      if (eleTotal != null) {
        eleTotal.innerHTML = formatPrice(this.total);
      }
      eleCartCountItem.forEach((item) => (item.innerHTML = this.cart.length));
      this.renderCartMini();
      if (eleCartListTotal) {
        eleCartListTotal.innerHTML = formatPrice(this.total);
      }

      if (eleCartCheckoutTotal) {
        eleCartCheckoutTotal.innerHTML = formatPrice(this.total);
      }
    }
  }

  renderCartMini() {
    const _this = this;
    let items = "";

    if (_this.cart.length > 0) {
      _this.cart.forEach((item) => {
        items += ` <div class="ps-product--mini-cart">
                            <div class="ps-product__thumbnail"><a href="#"><img src="${
                              item.thumbnail
                            }"
                                alt=""></a></div>
                            <div class="ps-product__content"><span class="ps-product__remove remove-mini-cart-item" data-product-id="${
                              item.id
                            }"><i class="icon-cross"></i></span><a
                                class="ps-product__title" href="/san-pham">${
                                  item.title
                                }</a>
                            <p> Qty: ${
                              item.qty
                            }</p><span class="ps-product__price">${formatPrice(
          item.price
        )}</span>
                            </div>
                        </div>`;
      });
      eleMiniCartItems.innerHTML = items;
      eleRemoveMiniCartItem =
        document.querySelectorAll(".remove-mini-cart-item") ?? [];
      eleRemoveMiniCartItem.forEach((item) => {
        item.addEventListener("click", function (event) {
          const productId = item.dataset.productId;
          _this.removeItem(productId);
        });
      });
    } else {
      eleMiniCartItems.innerHTML = "";
    }
  }

  renderCartMain() {
    const _this = this;
    let items = "";
    if (eleCartListMain) {
      if (_this.cart.length === 0) {
        eleCartListAlert.innerHTML = `<p class="text-center text-warning"> Chưa chọn sản phẩm nào </p>`;
        eleCartListMain.innerHTML = ``;
        return;
      }
      _this.cart.forEach((item) => {
        items += `<tr>
                <td>
                  <div class="ps-product--sidebar">
                    <div class="ps-product__thumbnail"><a class="ps-product__overlay" href="product-default.html"></a><img src="img/homepage/home-fullwidth/3.jpg" alt=""></div>
                    <div class="ps-product__content"><a class="ps-product__title" href="san-pham/${
                      item.id
                    }">${item.title}</a>
                    </div>
                  </div>
                </td>
                <td><strong>${formatPrice(item.price)}</strong></td>
                <td>
                  <div class="form-group--number">
                    <input onkeyup="cart.updateCartMain(${
                      item.id
                    })" class="form-control" type="text" value="${item.qty}">
                  </div>
                </td>
                <td>
                  <p><strong>${formatPrice(item.price * item.qty)}</strong></p>
                </td>
                <td class="remove-mini-cart-item" data-product-id="${
                  item.id
                }"><a class="ps-icon"><i class="icon-cross"></i></a></td>
              </tr>`;
      });

      eleCartListMain.innerHTML = items;
      eleRemoveMiniCartItem =
        document.querySelectorAll(".remove-mini-cart-item") ?? [];
      eleRemoveMiniCartItem.forEach((item) => {
        item.addEventListener("click", function (event) {
          const productId = item.dataset.productId;
          _this.removeItem(productId);
        });
      });
    }
  }

  updateCartMain(id) {
    const index = this.cart.findIndex((item) => item.id == id);
    const quantity = event.target.value;

    if (this.timer != null) {
      clearTimeout(this.timer);
    } else {
      setTimeout(() => {
        if (index != -1) {
          this.cart[index].qty = quantity;
          localStorage.setItem("cart", JSON.stringify(this.cart));
          this.total = this.cart && this.cart.length > 0 ? this.getTotal() : 0;
          this.renderCartMain();
          this.renderCartHeader();
        }
      }, 200);
    }
  }

  addTocart() {
    const _this = this;
    eleAddToCarts.forEach((item) => {
      item.addEventListener("click", function () {
        const product = JSON.parse(item.dataset.product);
        const index = _this.cart.findIndex((item) => item.id == product.id);
        let countProduct = 1;
        // check qty
        if (qty) {
          countProduct = parseInt(qty.value);
        }

        if (index === -1) {
          product.qty = countProduct;
          _this.cart.push(product);
          _this.total += countProduct * product.price;
        } else {
          _this.cart[index].qty = parseInt(_this.cart[index].qty);
          _this.cart[index].qty += countProduct;
          _this.total += product.price * countProduct;
          console.log(product.price, " price");
        }

        if (countProduct > 1) {
          qty.value = 1;
        }
        localStorage.setItem("cart", JSON.stringify(_this.cart));

        if (item.dataset.redirect) {
          window.location.href = "/gio-hang";
        }
        $.notify("Thêm sản phẩm vào giỏ hàng thành công", "success");
        _this.renderCartHeader();
      });
    });
  }

  removeItem(productId) {
    const index = this.cart.findIndex((item) => item.id == productId);
    if (index != -1) {
      this.total = this.cart[index].price * this.cart[index].qty;
      this.cart.splice(index, 1);
      this.renderCartHeader();
      this.renderCartMain();
      localStorage.setItem("cart", JSON.stringify(this.cart));
      $.notify("Xóa sản phẩm khỏi giỏ hàng thành công", "info");
    }
  }

  removeAll() {
    localStorage.removeItem("cart");
    this.cart = [];
  }

  checkOut() {
    const _this = this;
    if (cartCheckout) {
      cartCheckout.addEventListener("click", function () {
        if (typeCheckout == 1) {
          fetch("/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cart: _this.cart }),
          })
            .then((response) => response.json())
            .then((data) => {
              $.notify("Đặt hàng thành công", "success");
              eleCartContent.innerHTML =
                "<div class='alert alert-primary'>Đặt hàng thành công, chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất</div>";
              _this.removeAll();
              _this.renderCartHeader();
            })
            .catch((error) => {
              $.notify("Xảy ra một lỗi nghiêm trọng", "danger");
            });
        } else {
          fetch("/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cart: _this.cart }),
          })
            .then((response) => response.json())
            .then((data) => {

              fetch("/payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId:data[0] ?? 1,
                  amount: data[3],
                  orderInfo: "Thanh toan online",
                }),
              })
                .then((response) => response.json())
                .then((data) => {
                  window.location.href = data.data;
                  $.notify("Đặt hàng thành công", "success");
                  eleCartContent.innerHTML =
                    "<div class='alert alert-primary'>Đặt hàng thành công, chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất</div>";
                  _this.removeAll();
                  _this.renderCartHeader();
                })
                .catch((error) => {
                  $.notify("Xảy ra một lỗi nghiêm trọng", "danger");
                });
            })
            .catch((error) => {
              $.notify("Xảy ra một lỗi nghiêm trọng", "danger");
            });
        }
      });
    }
  }
}

const cart = new Cart();

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

const url_back = getParameterByName("url_back");

if (url_back) {
  const inputUrlBack = document.querySelector("[name=urlBack]");
  inputUrlBack.value = url_back;
}

const eleWishListContent = document.querySelector("#wishList-content");

const eleMiniWishListItems = document.querySelector("#mini-wishList-items");
const eleWishListListMain = document.querySelector("#wishList-list-main");
const eleWishListListAlert = document.querySelector("#wishList-list-alert");
const eleWishListListTotal = document.querySelector("#wishList-list-total");
const eleWishListCheckoutTotal = document.querySelector("#checkout-total");
const eleAddToWishLists = document.querySelectorAll(".add-wishList");
let eleRemoveMiniWishListItem = document.querySelectorAll(
  ".remove-mini-wishList-item"
);
const eleWishListCountItem = document.querySelectorAll(".wishList-count-item");
const eleTotalWishList = document.querySelector("#header_wishList-total");
const qtyWishList = document.querySelector("#product-qty");

class WishList {
  constructor() {
    this.wishList = localStorage.getItem("wishList")
      ? JSON.parse(localStorage.getItem("wishList"))
      : [];
    this.add();
    this.renderWishListHeader();
    this.renderWishListMain();
  }

  add() {
    const _this = this;
    eleAddToWishLists.forEach((item) => {
      item.addEventListener("click", function () {
        const product = JSON.parse(item.dataset.product);
        const index = _this.wishList.findIndex((item) => item.id == product.id);
        let countProduct = 1;
        // check qty
        if (qtyWishList) {
          countProduct = parseInt(qtyWishList.value);
        }

        if (index === -1) {
          product.qty = countProduct;
          _this.wishList.push(product);
          _this.total += countProduct * product.price;
        } else {
          _this.wishList[index].qty = parseInt(_this.wishList[index].qty);
          _this.wishList[index].qty += countProduct;
          _this.total += product.price * countProduct;
          console.log(product.price, " price");
        }

        if (countProduct > 1) {
          qty.value = 1;
        }
        localStorage.setItem("wishList", JSON.stringify(_this.wishList));

        if (item.dataset.redirect) {
          window.location.href = "/wishlist";
        }
        $.notify("Thêm sản phẩm wishlist hàng thành công", "success");
        _this.renderWishListHeader();
      });
    });
  }

  remove(productId) {
    const index = this.wishList.findIndex((item) => item.id == productId);
    if (index != -1) {
      this.total -= this.wishList[index].price * this.wishList[index].qty;
      this.wishList.splice(index, 1);
      this.renderWishListHeader();
      this.renderWishListMain();
      localStorage.setItem("wishList", JSON.stringify(this.wishList));
      $.notify("Xóa sản phẩm khỏi wishlist thành công", "info");
    }
  }

  renderWishListHeader() {
    eleWishListCountItem.forEach(
      (item) => (item.innerHTML = this.wishList.length)
    );
  }

  renderWishListMain() {
    const _this = this;
    let items = "";
    if (eleWishListListMain) {
      if (_this.wishList.length === 0) {
        eleWishListListAlert.innerHTML = `<p class="text-center text-warning"> Chưa chọn sản phẩm nào </p>`;
        eleWishListListMain.innerHTML = ``;
        return;
      }
      _this.wishList.forEach((item) => {
        items += `<tr>
                <td>
                  <div class="ps-product--sidebar">
                    <div class="ps-product__thumbnail"><a class="ps-product__overlay" href="product-default.html"></a><img src="img/homepage/home-fullwidth/3.jpg" alt=""></div>
                    <div class="ps-product__content"><a class="ps-product__title" href="san-pham/${
                      item.id
                    }">${item.title}</a>
                    </div>
                  </div>
                </td>
                <td><strong>${formatPrice(item.price)}</strong></td>
                <td class="remove-mini-wishList-item" data-product-id="${
                  item.id
                }"><a class="ps-icon"><i class="icon-cross"></i></a></td>
              </tr>`;
      });

      eleWishListListMain.innerHTML = items;
      eleRemoveMiniWishListItem =
        document.querySelectorAll(".remove-mini-wishList-item") ?? [];
      eleRemoveMiniWishListItem.forEach((item) => {
        item.addEventListener("click", function (event) {
          const productId = item.dataset.productId;
          _this.remove(productId);
        });
      });
    }
  }
}

const wishList = new WishList();

function pickOption(value) {
  typeCheckout = value;
}
