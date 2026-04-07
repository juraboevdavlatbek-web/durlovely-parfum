// DURLOVELY PARFUM - Premium App Logic (v2.0)

const tg = window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
    tg.enableClosingConfirmation();
    if (tg.setHeaderColor) tg.setHeaderColor('#0c0a09');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#0c0a09');
}

const API_BASE = '/api';

window.showAlert = function(msg) {
    if (tg && tg.showAlert) tg.showAlert(msg);
    else alert(msg);
};

// Global UI Elements
const ageGate = document.getElementById('age-gate');
const securityScreen = document.getElementById('security');
const mainApp = document.getElementById('app-main');
const pearl = document.getElementById('dur-pearl');
const target = document.getElementById('slider-target');
const authScreen = document.getElementById('auth-screen');
const birthdayScreen = document.getElementById('birthday-screen');

// 3. Routing & Pages (v2.0 UI)
const pages = {
    home: `
        <div class="animate-fluid" style="padding-bottom: 120px;">
            <!-- Premium Header (v3.0) -->
            <header style="padding: 20px 15px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: rgba(12, 10, 9, 0.8); backdrop-filter: blur(20px); z-index: 100;">
                <div class="dur-balance liquid-glass" onclick="showDurHistory()" style="padding: 8px 16px; border-radius: 50px; display: flex; align-items: center; gap: 8px; border-color: rgba(161,98,7,0.3); background: rgba(28,25,23,0.6); cursor: pointer;">
                    <div class="mini-pearl"></div>
                    <span id="dur-count" style="font-weight: 700; font-size: 16px; color: #fff;">0.0</span>
                </div>
                <div class="luxury-text gold-text" style="font-size: 1.6rem; letter-spacing: 0.15em; font-weight: 800; position: absolute; left: 50%; transform: translateX(-50%);">DURLOVELY</div>
                <div class="notifications" onclick="showNotifications()" style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: flex-end; font-size: 24px; color: #888; position: relative; cursor: pointer;">
                    <i class="fa-regular fa-bell"></i>
                    <span id="notif-badge" style="position: absolute; top: 8px; right: 0; width: 8px; height: 8px; background: #a16207; border-radius: 50%; border: 2px solid #0c0a09; display: none;"></span>
                </div>
            </header>

            <!-- Hero Banner Slider -->
            <div class="banner-section" style="padding: 0 15px;">
                <div class="liquid-glass" style="height: 320px; position: relative; overflow: hidden; border-radius: 32px; border: none; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                    <img src="/shared-assets/assets/images/banner.png" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7);">
                    <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(12,10,9,1) 0%, rgba(12,10,9,0.3) 50%, transparent 100%);"></div>
                    <div style="position: absolute; bottom: 35px; left: 25px; right: 25px;">
                        <span style="color: var(--accent); font-size: 11px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 8px; display: block;">Yangi Kolleksiya</span>
                        <h2 class="luxury-text" style="font-size: 2.4rem; line-height: 1.1; margin-bottom: 20px; color: #fff;">Qirollik Iforlari<br><span class="gold-text">2026</span></h2>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn-primary" style="padding: 12px 24px; font-size: 12px;" onclick="navigate('catalog')">Kashf etish</button>
                            <button class="liquid-glass" style="padding: 12px 24px; font-size: 12px; color: #fff; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);">Batafsil</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Categories Quick Filter -->
            <div style="display: flex; gap: 15px; padding: 30px 15px 20px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;">
                <style>div::-webkit-scrollbar { display: none; }</style>
                <div class="category-btn active" style="padding: 12px 24px; background: var(--accent); border-radius: 50px; color: #fff; font-size: 14px; white-space: nowrap; font-weight: 600; box-shadow: 0 8px 20px rgba(161,98,7,0.3);">Barchasi</div>
                <div class="category-btn liquid-glass" style="padding: 12px 24px; border-radius: 50px; color: #888; font-size: 14px; white-space: nowrap; font-weight: 500;">Erkaklar</div>
                <div class="category-btn liquid-glass" style="padding: 12px 24px; border-radius: 50px; color: #888; font-size: 14px; white-space: nowrap; font-weight: 500;">Ayollar</div>
                <div class="category-btn liquid-glass" style="padding: 12px 24px; border-radius: 50px; color: #888; font-size: 14px; white-space: nowrap; font-weight: 500;">Uniseks</div>
            </div>

            <!-- Dur Box Gamification -->
            <div style="padding: 10px 15px 30px;">
                <div id="dur-box-card" class="liquid-glass" onclick="openDurBox()" style="padding: 25px; border-radius: 28px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(28,25,23,1), rgba(161,98,7,0.15)); border-color: rgba(161,98,7,0.2); cursor: pointer;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <h3 class="luxury-text gold-text" style="font-size: 1.6rem;">Dur Box</h3>
                            <span id="dur-level-badge" style="background: rgba(161,98,7,0.2); color: var(--accent); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">LVL 1</span>
                        </div>
                        <p id="dur-progress-text" style="font-size: 13px; color: #888; font-weight: 300;">Keyingi sovg'agacha 50 ball qoldi</p>
                        <div style="margin-top: 18px; height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; width: 85%; position: relative; overflow: hidden;">
                            <div id="dur-progress-fill" class="shimmer" style="position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: var(--accent); border-radius: 10px; box-shadow: 0 0 15px var(--accent); transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                        </div>
                    </div>
                    <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: rgba(161,98,7,0.1); border-radius: 24px; transform: rotate(-5deg); border: 1px solid rgba(161,98,7,0.2);">
                        <i id="dur-box-icon" class="fa-solid fa-gift" style="font-size: 35px; color: var(--accent);"></i>
                    </div>
                </div>
            </div>

            <!-- Best Sellers Grid -->
            <div style="padding: 0 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h3 class="luxury-text" style="font-size: 1.8rem; letter-spacing: -0.01em;">Xit Mahsulotlar</h3>
                    <a href="#" onclick="navigate('catalog')" style="color: var(--accent); font-size: 13px; font-weight: 600; text-decoration: none;">Hammasi <i class="fa-solid fa-arrow-right" style="margin-left: 5px;"></i></a>
                </div>
                <div class="product-grid" id="home-product-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Filled by init code -->
                </div>
            </div>
        </div>
    `,
    catalog: `
        <div class="animate-fluid" style="padding-bottom: 120px;">
            <div style="padding: 25px 20px 10px;">
                <h2 class="luxury-text gold-text" style="font-size: 2rem; margin-bottom: 20px;">Katalog</h2>
                
                <!-- AI Search Input -->
                <div class="input-group liquid-glass" style="border-radius: 15px; margin-bottom: 20px;">
                    <i class="fa-solid fa-magnifying-glass" style="color: var(--accent); margin-right: 12px;"></i>
                    <input type="text" id="catalog-search" placeholder="Iforni tabiiy tilda qidiring..." oninput="searchProducts(this.value)" style="font-size: 14px;">
                    <i class="fa-solid fa-microphone" style="color: var(--accent); margin-left:10px; opacity: 0.5;"></i>
                </div>

                <!-- Gender Tabs -->
                <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                    <button class="category-btn active" style="flex: 1; padding: 10px; background: var(--accent); border-radius: 12px; color: #fff; font-size: 12px; border:none;" onclick="searchProducts('')">Barchasi</button>
                    <button class="category-btn" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 12px; color: #888; font-size: 12px; border: 1px solid var(--border);" onclick="searchProducts('erkaklar')">Erkaklar</button>
                    <button class="category-btn" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 12px; color: #888; font-size: 12px; border: 1px solid var(--border);" onclick="searchProducts('ayollar')">Ayollar</button>
                </div>
            </div>

            <div id="catalog-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 15px;">
                <!-- Products will be rendered here -->
            </div>
        </div>
    `,
    likes: `
        <div class="animate-fluid" style="padding-bottom: 120px;">
            <div style="padding: 25px 20px 10px;">
                <h2 class="luxury-text gold-text" style="font-size: 2rem; margin-bottom: 5px;">💖 Sevimlilar</h2>
                <p id="likes-count" style="font-size: 13px; color: #666; margin-bottom: 20px;">0 ta mahsulot</p>
            </div>
            <div id="likes-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 15px;">
            </div>
            <div id="likes-empty" style="text-align: center; padding: 60px 0; display: none;">
                <i class="fa-regular fa-heart" style="font-size: 50px; color: #333; margin-bottom: 20px; display: block;"></i>
                <p style="color: #666; margin-bottom: 5px;">Hali sevimli mahsulot yo'q</p>
                <p style="color: #444; font-size: 13px; margin-bottom: 25px;">Katalogdagi ❤️ tugmasini bosing</p>
                <button class="btn-primary" style="padding: 12px 30px;" onclick="navigate('catalog')">KATALOGGA</button>
            </div>
        </div>
    `,
    cart: `
        <div class="animate-fluid" style="padding-bottom: 120px;">
            <div id="cart-items-section" style="padding: 25px 20px;">
                <h2 class="luxury-text gold-text" style="font-size: 2rem; margin-bottom: 25px;">Savatcha</h2>
                <div id="cart-list" style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- Cart items will be rendered by JS -->
                </div>
                <div id="cart-empty" class="hide" style="text-align: center; padding: 50px 0;">
                    <i class="fa-solid fa-shopping-bag" style="font-size: 50px; color: #333; margin-bottom: 20px;"></i>
                    <p style="color: #666;">Savatchangiz bo'sh</p>
                    <button class="btn-primary" style="margin-top: 20px;" onclick="navigate('catalog')">XARID QILISH</button>
                </div>
                <div id="cart-summary" class="liquid-glass" style="margin-top: 30px; padding: 20px; border-radius: 20px; border-color: var(--accent);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #888;">Jami:</span>
                        <span id="total-price" style="font-weight: 700; color: #fff;">0 UZS</span>
                    </div>
                    <button class="btn-primary" style="width: 100%; margin-top: 10px;" onclick="showCheckout()">BUYURTMA BERISH</button>
                </div>
            </div>

            <!-- Checkout Section -->
            <div id="checkout-section" class="hide" style="padding: 25px 20px;">
                <h2 class="luxury-text gold-text" style="font-size: 2rem; margin-bottom: 20px;">Logistika</h2>
                <div class="auth-card liquid-glass" style="max-width: 100%; padding: 25px;">
                    <label style="font-size: 11px; color: var(--accent); text-transform: uppercase; margin-bottom: 5px; display: block;">Viloyat / Shahar</label>
                    <select id="region" class="date-input" style="width: 100%; margin-bottom: 20px; text-align: left; background: #000;">
                        <option value="">Tanlang...</option>
                        <option value="toshkent">Toshkent shahri</option>
                        <option value="toshkent_v">Toshkent viloyati</option>
                        <option value="andijon">Andijon</option>
                        <option value="buxoro">Buxoro</option>
                        <option value="fargona">Farg'ona</option>
                        <option value="jizzax">Jizzax</option>
                        <option value="xorazm">Xorazm</option>
                        <option value="namangan">Namangan</option>
                        <option value="navoiy">Navoiy</option>
                        <option value="qashqadaryo">Qashqadaryo</option>
                        <option value="samarqand">Samarqand</option>
                        <option value="sirdaryo">Sirdaryo</option>
                        <option value="surxondaryo">Surxondaryo</option>
                        <option value="qoraqalpog">Qoraqalpog'iston</option>
                    </select>

                    <label style="font-size: 11px; color: var(--accent); text-transform: uppercase; margin-bottom: 5px; display: block;">Aniq Manzil (Tuman, ko'cha, uy)</label>
                    <textarea id="address" class="date-input" placeholder="Chilonzor 7-kvartal, 12-uy..." style="width: 100%; height: 80px; text-align: left; background: #000; margin-bottom: 25px;"></textarea>
                    
                    <label style="font-size: 11px; color: var(--accent); text-transform: uppercase; margin-bottom: 15px; display: block;">Yetkazib berish turi</label>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <label class="liquid-glass" style="display: flex; align-items: center; padding: 12px; border-radius: 12px; cursor: pointer;">
                            <input type="radio" name="delivery" value="quva" checked style="accent-color: var(--accent); width: 20px; height: 20px; margin-right: 15px;">
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">Quva Kuryer</div>
                                <div style="font-size: 10px; color: #888;">Standard (24-48 soat) • 25,000 UZS</div>
                            </div>
                        </label>
                        <label class="liquid-glass" style="display: flex; align-items: center; padding: 12px; border-radius: 12px; cursor: pointer;">
                            <input type="radio" name="delivery" value="emu" style="accent-color: var(--accent); width: 20px; height: 20px; margin-right: 15px;">
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: #fff;">EMU Express</div>
                                <div style="font-size: 10px; color: #888;">Tezkor (Bugunning o'zida) • 45,000 UZS</div>
                            </div>
                        </label>
                    </div>

                    <button class="btn-primary" style="width: 100%; margin-top: 35px;" onclick="submitOrder()">TASDIQLASH</button>
                </div>
            </div>
        </div>
    `,
    gift: `
        <div class="animate-fluid" style="padding: 30px;">
            <h2 class="luxury-text gold-text" style="font-size: 2.2rem; margin-bottom: 25px;">🎁 Sovg'a</h2>
            <div class="liquid-glass" style="padding: 30px; border-radius: 28px; text-align: center;">
                <div style="width: 80px; height: 80px; background: rgba(161,98,7,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px; color: var(--accent); font-size: 35px;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <h3 class="luxury-text" style="font-size: 1.6rem; margin-bottom: 15px;">Yaqinlarga Ifor</h3>
                <p style="font-weight: 300; color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                    Yaqinlaringizga anonim premium sovg'alar yuboring. <br>Har bir sovg'a uchun maxsus <span class="gold-text">Dur</span> bonuslari beriladi.
                </p>
                <button class="btn-primary" style="width: 100%; height: 50px; border-radius: 12px;">SOVG'A TANLASH</button>
            </div>
        </div>
    `,
    orders: `
        <div class="animate-fluid" style="padding-bottom: 120px;">
            <div style="padding: 25px 20px 10px; display: flex; align-items: center; gap: 15px;">
                <button onclick="navigate('profile')" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: #fff;">
                    <i class="fa-solid fa-arrow-left" style="font-size: 14px;"></i>
                </button>
                <h2 class="luxury-text gold-text" style="font-size: 2rem;">Buyurtmalarim</h2>
            </div>
            <div id="orders-history-list" style="padding: 0 20px; display: flex; flex-direction: column; gap: 15px;">
                <!-- Orders will be rendered here -->
            </div>
            <div id="orders-empty" style="text-align: center; padding: 60px 0; display: none;">
                <i class="fa-solid fa-box-open" style="font-size: 50px; color: #333; margin-bottom: 20px; display: block;"></i>
                <p style="color: #666; margin-bottom: 25px;">Sizda hali buyurtmalar mavjud emas</p>
                <button class="btn-primary" style="padding: 12px 30px;" onclick="navigate('catalog')">XARID QILISH</button>
            </div>
        </div>
    `,
    profile: `
        <div class="animate-fluid" style="padding-bottom: 120px;">
            <div style="padding: 25px 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h2 class="luxury-text gold-text" style="font-size: 2.2rem;">Profil</h2>
                    <div class="liquid-glass" style="width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--accent);">
                        <i class="fa-solid fa-gear"></i>
                    </div>
                </div>
                
                <!-- Premium Membership Card -->
                <div class="vip-card-container liquid-glass" style="height: 220px; border-radius: 32px; position: relative; overflow: hidden; background: linear-gradient(135deg, #1C1917 0%, #44403C 100%); border: 1px solid var(--accent); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: var(--accent); opacity: 0.1; filter: blur(50px); border-radius: 50%;"></div>
                    <div style="position: absolute; inset: 0; padding: 30px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 5px;">A'zolik kartasi</div>
                                <div class="luxury-text" style="font-size: 1.8rem; color: #fff;" id="profile-member-level">MEMBER</div>
                            </div>
                            <div id="profile-vip-badge" style="display: none; font-size: 28px; font-weight: 900; color: rgba(255,215,0,0.3); font-family: 'Montserrat', sans-serif; text-shadow: 0 0 20px rgba(255,215,0,0.1);">VIP</div>
                        </div>
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: #aaa; margin-bottom: 5px; font-family: 'Montserrat', sans-serif;" id="profile-user-name">Foydalanuvchi</div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 12px; font-weight: 600; color: #fff; opacity: 0.8; letter-spacing: 0.1em;" id="profile-user-id">ID: ...</div>
                                <div style="font-size: 10px; color: var(--accent); font-weight: 800;">DURLOVELY EXCLUSIVE</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px;">
                    <div class="liquid-glass" style="padding: 25px; border-radius: 24px; text-align: center; background: rgba(161,98,7,0.03); border-color: rgba(161,98,7,0.1);">
                        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 700;">Balans</div>
                        <div style="font-size: 22px; font-weight: 800; color: var(--accent);">0 <span style="font-size: 14px;">💎</span></div>
                    </div>
                    <div class="liquid-glass" style="padding: 25px; border-radius: 24px; text-align: center;">
                        <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 700;">Buyurtmalar</div>
                        <div style="font-size: 22px; font-weight: 800; color: #fff;">0 <span style="font-size: 14px; color: #444;">ta</span></div>
                    </div>
                </div>

                <!-- Menu Items -->
                <div style="margin-top: 35px; display: flex; flex-direction: column; gap: 12px;">
                    <div class="liquid-glass" style="padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 18px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(161,98,7,0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                            <span style="font-size: 15px; font-weight: 500;">Manzillarim</span>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #444; font-size: 12px;"></i>
                    </div>
                    <div class="liquid-glass" style="padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 18px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(34,197,94,0.1); color: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <span style="font-size: 15px; font-weight: 500;">Xavfsizlik</span>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #444; font-size: 12px;"></i>
                    </div>
                    <div class="liquid-glass" style="padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 18px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05); color: #888; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                <i class="fa-solid fa-circle-info"></i>
                            </div>
                            <span style="font-size: 15px; font-weight: 500;">Yordam markazi</span>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #444; font-size: 12px;"></i>
                    </div>
                </div>

                <!-- VIP Join Section (hidden for VIP users) -->
                <div id="vip-join-section" style="margin-top: 35px;">
                    <div class="liquid-glass" style="padding: 30px 25px; border-radius: 28px; text-align: center; border: 1px solid rgba(161,98,7,0.2); background: linear-gradient(135deg, rgba(161,98,7,0.05) 0%, rgba(0,0,0,0) 100%);">
                        <div style="font-size: 36px; margin-bottom: 12px;">👑</div>
                        <div class="luxury-text gold-text" style="font-size: 1.3rem; margin-bottom: 8px;">VIP a'zo bo'ling!</div>
                        <p style="font-size: 13px; color: #888; margin-bottom: 20px; line-height: 1.5;">Maxsus chegirmalar, eksklyuziv iforlar va VIP xizmatdan foydalaning</p>
                        <button class="btn-primary" style="width: 100%; height: 52px; border-radius: 16px; font-size: 15px; font-weight: 700; background: linear-gradient(135deg, var(--accent) 0%, #D4A017 100%); border: none; cursor: pointer;" onclick="showAlert('VIP xizmat tez orada ishga tushadi! ✨')">
                            <i class="fa-solid fa-crown" style="margin-right: 8px;"></i> VIP GA ULANISH
                        </button>
                    </div>
                </div>

                <button class="btn-exit" style="width: 100%; margin-top: 50px; height: 55px; border-radius: 16px; border-color: rgba(239,68,68,0.2); color: #ef4444;" onclick="localStorage.clear(); location.reload();">
                    <i class="fa-solid fa-right-from-bracket" style="margin-right: 10px;"></i> HISOBDAN CHIQISH
                </button>
            </div>
        </div>
    `,
};

window.navigate = async function(page) {
    const pageContent = document.getElementById('page-content');
    if (!pageContent) return;
    
    // Add temporary exit animation if needed, but smooth enough without it
    pageContent.innerHTML = pages[page];

    if (page === 'home') {
        const homeGrid = document.getElementById('home-product-grid');
        console.log(`[NAV] Home Page. allProducts length: ${allProducts ? allProducts.length : 'NULL'}`);
        if (homeGrid && allProducts && allProducts.length > 0) {
            // Show latest 4 products
            const latest = [...allProducts].reverse().slice(0, 4);
            homeGrid.innerHTML = latest.map(p => renderProductCard(p)).join('');
            console.log(`[NAV] Rendered 4 product cards.`);
        } else {
            console.warn(`[NAV] Home grid not found or ALL_PRODUCTS empty! Grid: ${!!homeGrid}`);
        }
    }

    // Initialize Catalog if navigating to it
    if (page === 'catalog') {
        searchProducts('');
    }

    // Initialize Likes page
    if (page === 'likes') {
        renderLikes();
    }
    
    // Initialize Cart if navigating to it
    if (page === 'cart') {
        renderCart();
    }

    // Initialize Profile with dynamic data
    if (page === 'profile') {
        const tgUser = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : null;
        const tgId = tgUser ? tgUser.id : 737113132;
        
        // Set name from Telegram
        const nameEl = document.getElementById('profile-user-name');
        if (nameEl && tgUser) {
            const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
            nameEl.textContent = fullName || ('@' + tgUser.username) || 'Foydalanuvchi';
        }
        
        // Set ID from Telegram user id
        const idEl = document.getElementById('profile-user-id');
        if (idEl) {
            const idStr = String(tgId);
            const formatted = idStr.replace(/(\d{3})(?=\d)/g, '$1 ');
            idEl.textContent = 'ID: ' + formatted;
        }
        
        // Fetch real data from backend
        try {
            const [customerRes, ordersRes] = await Promise.all([
                fetch(`/api/customers/check/${tgId}`),
                fetch('/api/orders')
            ]);
            const customerData = await customerRes.json();
            const allOrders = await ordersRes.json();
            
            // VIP status from backend
            const isVip = customerData.found && customerData.customer.isVip;
            const vipBadge = document.getElementById('profile-vip-badge');
            const memberLevel = document.getElementById('profile-member-level');
            const vipJoin = document.getElementById('vip-join-section');
            
            if (isVip) {
                if (vipBadge) vipBadge.style.display = 'block';
                if (memberLevel) memberLevel.textContent = 'GOLD MEMBER';
                if (vipJoin) vipJoin.style.display = 'none';
            } else {
                if (vipBadge) vipBadge.style.display = 'none';
                if (memberLevel) memberLevel.textContent = 'MEMBER';
                if (vipJoin) vipJoin.style.display = 'block';
            }
            
            // Real order count
            const userPhone = localStorage.getItem('durlovely_user_auth');
            const myOrdersRes = await fetch(`${API_BASE}/orders/my?auth=${userPhone}&v=${Date.now()}`);
            const myOrders = await myOrdersRes.json();
            
            const orderCountCard = document.querySelector('#page-content .animate-fluid [style*="Buyurtmalar"]').parentElement;
            if (orderCountCard) {
                orderCountCard.onclick = () => navigate('orders');
                orderCountCard.style.cursor = 'pointer';
                const countDiv = orderCountCard.querySelector('div:last-child');
                if (countDiv) countDiv.innerHTML = `${myOrders.length} <span style="font-size: 14px; color: #444;">ta</span>`;
            }
        } catch(e) {
            console.error('Profile data fetch error:', e);
        }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update Nav Icons
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const span = item.querySelector('span');
        if (span && span.innerText.toLowerCase().includes(page)) {
            item.classList.add('active');
        }
    });

    if (page === 'orders') renderOrdersHistory();

    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
};

async function renderOrdersHistory() {
    const list = document.getElementById('orders-history-list');
    const empty = document.getElementById('orders-empty');
    if (!list) return;

    list.innerHTML = '<div class="premium-loader"></div>';

    try {
        const userPhone = localStorage.getItem('durlovely_user_auth');
        const res = await fetch(`${API_BASE}/orders/my?auth=${userPhone}`);
        const orders = await res.json();

        if (orders.length === 0) {
            list.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = orders.reverse().map(o => {
            const statusLabels = {
                'pending': { text: 'Kutishda', color: 'var(--accent)' },
                'delivered': { text: 'Yetkazildi', color: '#22c55e' },
                'cancelled': { text: 'Bekor qilindi', color: '#ef4444' }
            };
            const label = statusLabels[o.status] || { text: o.status, color: '#888' };
            
            return `
                <div class="liquid-glass animate-fluid" style="padding: 20px; border-radius: 20px; border-color: rgba(255,255,255,0.03);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 14px; font-weight: 700; color: #fff;">Buyurtma #${o.id}</span>
                        <span style="font-size: 11px; font-weight: 800; color: ${label.color}; text-transform: uppercase;">${label.text}</span>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 15px;">Sana: ${o.date}</div>
                    <div style="margin-bottom: 15px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 15px;">
                        ${o.items.map(item => `
                            <div style="font-size: 13px; color: #aaa; margin-bottom: 6px; display: flex; justify-content: space-between;">
                                <span>${item}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
                        <span style="font-size: 12px; color: #555;">Jami:</span>
                        <span style="font-size: 16px; font-weight: 800; color: #fff;">${o.total} UZS</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) {
        console.error('Render orders failed:', e);
        list.innerHTML = '<p style="color:#ef4444; text-align:center;">Ma\'lumot yuklashda xatolik</p>';
    }
}


// 1. Age Gate Global Actions
window.showSecurity = function() {
    localStorage.setItem('durlovely_age_verified_v2', 'true');
    ageGate.classList.add('hide');
    securityScreen.classList.remove('hide');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
};

window.exitApp = function() {
    if (tg && tg.close) {
        tg.close();
    }
    setTimeout(() => {
        window.location.href = 'https://google.com';
    }, 100);
};

// 2. Dur Slider Logic
let isDragging = false;
let startX = 0;
let currentX = 0;
const maxX = 224; // Track width (280) - padding - pearl size (46) approx

const onStart = (e) => {
    isDragging = true;
    startX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
};

const onMove = (e) => {
    if (!isDragging) return;
    const clientX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
    let moveX = clientX - startX;
    moveX = Math.max(0, Math.min(moveX, maxX));
    currentX = moveX;
    pearl.style.left = `${moveX + 5}px`;
    
    // Dynamic Glow Effect
    const progress = moveX / maxX;
    pearl.style.boxShadow = `0 0 ${15 + (progress * 20)}px rgba(161, 98, 7, ${0.4 + (progress * 0.6)})`;

    // Snap-to-target visual check
    if (moveX > 200) {
        target.style.opacity = '1';
        target.style.transform = 'scale(1.15)';
    } else {
        target.style.opacity = '0.4';
        target.style.transform = 'scale(1)';
    }
};

const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    if (currentX > maxX - 20) {
        pearl.style.left = `${maxX + 5}px`;
        successSecurity();
    } else {
        pearl.style.transition = 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        pearl.style.left = '5px';
        setTimeout(() => pearl.style.transition = '', 400);
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    }
};

if (pearl) {
    pearl.addEventListener('mousedown', onStart);
    pearl.addEventListener('touchstart', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
}

function successSecurity() {
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    securityScreen.classList.add('hide');
    showAuthScreen();
}

// 2.5 Auth - Native Telegram Share Contact
function showAuthScreen() {
    showScreen('auth-screen');
    const phoneStep = document.getElementById('phone-step');
    
    // If inside Telegram OR localhost, show the premium button
    if ((tg && tg.requestContact) || window.location.hostname === 'localhost') {
        phoneStep.innerHTML = `
            <div style="text-align:center; padding: 10px 0;">
                <i class="fa-brands fa-telegram" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 15px; display: block;"></i>
                <p style="font-size: 0.9rem; color: #aaa; margin-bottom: 20px;">Telegram sizning haqiqiy raqamingizni xavfsiz tarzda ulashadi</p>
                <button class="btn-primary" style="width:100%;" onclick="requestTelegramContact()">
                    <i class="fa-brands fa-telegram"></i> TELEGRAM ORQALI TASDIQLASH
                </button>
            </div>
        `;
    } else {
        // Browser fallback: show manual phone input
        phoneStep.innerHTML = `
            <div class="input-group">
                <span class="prefix">+998</span>
                <input type="tel" id="phone-input" placeholder="90 123 45 67" maxlength="12">
            </div>
            <button class="btn-primary" style="width: 100%; margin-top: 20px;" onclick="verifyPhone()">TASDIQLASH</button>
        `;
    }
}

window.requestTelegramContact = function() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log("🛠 [Dev Mode] Mocking Telegram Contact Share...");
        // Simulate a successful verification
        const phone = '+998901234567';
        const tgId = 737113132;
        
        fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, tgId: tgId, firstName: 'Local Dev' })
        }).then(res => res.json()).then(result => {
            localStorage.setItem('durlovely_user_auth', phone);
            authScreen.classList.add('hide');
            birthdayScreen.classList.remove('hide');
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        });
        return;
    }
    
    if (!tg || !tg.requestContact) {
        // Fallback for browser testing (manual phone)
        window.verifyPhone();
        return;
    }
    
    tg.requestContact((sent, response) => {
        if (sent && response && response.contact) {
            const contact = response.contact;
            let phone = contact.phone_number || '';
            if (!phone.startsWith('+')) phone = '+' + phone;
            
            if (!phone.startsWith('+998')) {
                showAlert("Kechirasiz, faqat O'zbekiston (+998) raqamlari qabul qilinadi.");
                return;
            }
            
            const tgId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 737113132;
            
            fetch(`${API_BASE}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone, tgId: tgId, firstName: tg.initDataUnsafe.user?.first_name || '' })
            }).then(res => res.json()).then(result => {
                if (result.blocked) {
                    showAlert("Hisobingiz bloklangan. Iltimos, admin bilan bog'laning.");
                    return;
                }
                if (result.success || result.ok) { // Added result.ok for backward compatibility if needed
                    localStorage.setItem('durlovely_user_auth', phone);
                    authScreen.classList.add('hide');
                    birthdayScreen.classList.remove('hide');
                    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                }
            }).catch(e => {
                // Ignore network errors silently for now or handle them
            });
        }
    });
};

// Fallback: manual phone for browser testing
window.verifyPhone = async function() {
    const phoneInputEl = document.getElementById('phone-input');
    if (!phoneInputEl) return;
    let phoneInput = phoneInputEl.value.replace(/\s+/g, '');
    
    if (phoneInput.length !== 9 || !/^\d+$/.test(phoneInput)) {
        showAlert("Iltimos, O'zbekiston raqamini to'g'ri kiriting (9 xona)");
        return;
    }
    
    const btn = phoneInputEl.parentElement.nextElementSibling;
    const oldText = btn.innerText;
    btn.innerText = 'KUTILMOQDA...';
    btn.disabled = true;

    const fullPhone = '+998' + phoneInput.replace(/\s+/g, '');
    if (fullPhone.length !== 13) {
        showAlert("Raqamni to'liq kiriting.");
        btn.innerText = oldText;
        btn.disabled = false;
        return;
    }
    const tgId = (tg && tg.initDataUnsafe?.user) ? tg.initDataUnsafe.user.id : 737113132;
    
    try {
        const res = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: fullPhone, tgId: tgId })
        });
        
        const result = await res.json();
        if (result.blocked) {
            showAlert("Hisobingiz bloklangan. Iltimos, admin bilan bog'laning.");
            btn.innerText = oldText;
            btn.disabled = false;
            return;
        }

        if (result.success) {
            localStorage.setItem('durlovely_user_auth', fullPhone);
            authScreen.classList.add('hide');
            birthdayScreen.classList.remove('hide');
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else {
            showAlert("Tarmoq xatosi yuz berdi");
        }
    } catch(e) {
        showAlert("Serverga ulanishda xato. Iltimos server:3000 ni ishga tushiring.");
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
};


window.saveBirthday = function() {
    const bday = document.getElementById('bday-input').value;
    if (!bday) {
        showAlert("Tug'ilgan kuningizni kiriting");
        return;
    }
    
    // Preserve the user's auth from the previous step (fullPhone)
    // localStorage.setItem('durlovely_user_auth', 'GOLD_MEMBER_777'); // Removed mock value
    birthdayScreen.classList.add('hide');
    mainApp.classList.remove('hide');
    navigate('home');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
};

// 2.8 Likes / Favorites System
function getLikes() {
    try { return JSON.parse(localStorage.getItem('durlovely_likes') || '[]'); }
    catch(e) { return []; }
}

function isLiked(id) {
    return getLikes().includes(id);
}

window.toggleLike = function(id) {
    let likes = getLikes();
    if (likes.includes(id)) {
        likes = likes.filter(x => x !== id);
    } else {
        likes.push(id);
    }
    localStorage.setItem('durlovely_likes', JSON.stringify(likes));
    
    // Re-render current page to update heart icons
    const current = document.querySelector('.nav-item.active span');
    if (current) {
        const pageName = current.innerText.toLowerCase();
        if (pageName.includes('catalog') || pageName.includes('katalog')) {
            const query = document.getElementById('catalog-search');
            searchProducts(query ? query.value : '');
        } else if (pageName.includes('likes') || pageName.includes('sevimli')) {
            renderLikes();
        } else {
            // Re-render home product grid
            const homeGrid = document.getElementById('home-product-grid');
            if (homeGrid) homeGrid.innerHTML = allProducts.slice(0, 4).map(p => renderProductCard(p)).join('');
        }
    }
    
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
};

function renderLikes() {
    const likes = getLikes();
    const likedProducts = allProducts.filter(p => likes.includes(p.id));
    const grid = document.getElementById('likes-grid');
    const empty = document.getElementById('likes-empty');
    const count = document.getElementById('likes-count');
    
    if (count) count.textContent = `${likedProducts.length} ta mahsulot`;
    
    if (likedProducts.length === 0) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
    } else {
        if (empty) empty.style.display = 'none';
        if (grid) grid.innerHTML = likedProducts.map(p => renderProductCard(p)).join('');
    }
}

// 2.9 Catalog & Search Logic
let allProducts = [];

async function fetchProducts() {
    try {
        console.log(`[FETCH] Requesting products from ${API_BASE}/products...`);
        const res = await fetch(`${API_BASE}/products?v=${Date.now()}`);
        allProducts = await res.json();
        console.log(`[FETCH] Success! Received ${allProducts.length} products.`);
        // If navigating to home, refresh the grid
        const homeGrid = document.getElementById('home-product-grid');
        if (homeGrid) {
            const latest = [...allProducts].reverse().slice(0, 4);
            homeGrid.innerHTML = latest.map(p => renderProductCard(p)).join('');
        }
    } catch (e) {
        console.error("[FETCH] Products Error:", e);
    }
}

window.searchProducts = function(query) {
    const resultsContainer = document.getElementById('catalog-grid');
    if (!resultsContainer) return;

    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.gender.toLowerCase().includes(query.toLowerCase())
    );

    resultsContainer.innerHTML = filtered.map(p => renderProductCard(p)).join('');
};

window.playAudio = function(id) {
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    const btn = document.querySelector(`.audio-btn-${id}`);
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            showAlert(`${allProducts.find(x => x.id === id).name} ifori tavsifi (Demo Audio)`);
        }, 2000);
    }
};

function renderProductCard(p) {
    const isVip = localStorage.getItem('durlovely_vip_status') === 'true';
    const cleanPrice = (val) => parseInt(String(val || 0).replace(/[^\d]/g, '')) || 0;
    
    const displayPrice = isVip ? (cleanPrice(p.vip_price || p.price)) : cleanPrice(p.price);
    const formattedPrice = displayPrice.toLocaleString();
    const productImg = p.image || p.img || '/shared-assets/assets/images/logo.png';

    return `
        <div class="product-card liquid-glass" style="padding: 12px; border-radius: 24px; cursor: pointer;" onclick="showProductDetail(${p.id})">
            <div style="height: 180px; border-radius: 18px; overflow: hidden; margin-bottom: 12px; position: relative;">
                <img src="${productImg}" onerror="this.src='/shared-assets/assets/images/logo.png'; this.onerror=null;" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                ${p.audio ? `
                    <button class="audio-btn-${p.id} liquid-glass" onclick="event.stopPropagation(); playAudio(${p.id})" style="position: absolute; bottom: 10px; left: 10px; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--accent); border-color: var(--accent); font-size: 14px; z-index: 5;">
                        <i class="fa-solid fa-volume-high"></i>
                    </button>
                ` : ''}
                <div onclick="event.stopPropagation(); toggleLike(${p.id})" style="position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.3); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; color: ${isLiked(p.id) ? '#ef4444' : '#fff'}; font-size: 14px; cursor: pointer;">
                    <i class="fa-${isLiked(p.id) ? 'solid' : 'regular'} fa-heart"></i>
                </div>
            </div>
            <h4 style="font-size: 14px; font-weight: 600; color: #fff; font-family: 'Montserrat', sans-serif;">${p.name}</h4>
            <p style="font-size: 11px; color: #888; margin: 4px 0 12px;">${p.category || 'Eau de Parfum'} • ${p.gender || 'Uniseks'}</p>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 16px; font-weight: 700; color: #fff;">${formattedPrice} UZS</span>
                ${isVip ? `<span class="gold-text" style="font-size: 10px; font-weight: 800;">VIP CHEGIRMADA</span>` : `<span class="gold-text" style="font-size: 12px; font-weight: 600;">VIP: ${Number(p.vip_price || p.price * 0.8).toLocaleString()} UZS</span>`}
            </div>
            <button class="btn-primary" style="width: 100%; height: 38px; font-size: 11px; margin-top: 15px; border-radius: 12px;" onclick="event.stopPropagation(); addToCart(${p.id})">SAVATCHAGA</button>
        </div>
    `;
}

window.showProductDetail = function(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const isVip = localStorage.getItem('durlovely_vip_status') === 'true';
    const displayPrice = isVip ? (p.vip_price || p.price) : p.price;
    const formattedPrice = Number(displayPrice).toLocaleString();
    const formattedOldPrice = Number(p.price).toLocaleString();
    const productImg = p.image || p.img || '/shared-assets/assets/images/logo.png';

    const detailPage = `
        <div class="animate-fluid" style="padding-bottom: 120px;">
            <div style="position: relative; height: 400px; overflow: hidden; border-radius: 0 0 40px 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                <button onclick="navigate('catalog')" style="position: absolute; top: 20px; left: 20px; width: 45px; height: 45px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: #fff; border: 1px solid rgba(255,255,255,0.1); z-index: 10; font-size: 16px;">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <img src="${productImg}" style="width: 100%; height: 100%; object-fit: cover;">
                <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(12,10,9,1) 0%, transparent 50%);"></div>
            </div>

            <div style="padding: 30px 20px; margin-top: -40px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <span style="color: var(--accent); font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;">${p.category || 'Eau de Parfum'}</span>
                        <h2 class="luxury-text gold-text" style="font-size: 2.2rem; margin-top: 5px;">${p.name}</h2>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 11px; color: #666; text-transform: uppercase;">Hajmi</span>
                        <span style="font-size: 16px; font-weight: 700; color: #fff;">100 ml</span>
                    </div>
                </div>

                <p style="font-weight: 300; line-height: 1.8; color: #888; font-size: 15px; margin-bottom: 35px;">
                    ${p.description || p.desc || "Ushbu premium ifor sizga o'zgacha dabdaba va ishonch tuyg'usini taqdim etadi. Tabiiy ingredientlardan tayyorlangan bo'lib, uzoq muddat davomida o'z tarovatini yo'qotmaydi."}
                </p>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; padding: 25px; border-radius: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03);">
                    <div>
                        <span style="display: block; font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 8px;">Narxi</span>
                        <span style="font-size: 24px; font-weight: 800; color: #fff;">${formattedPrice} <span style="font-size: 12px; color: #444;">UZS</span></span>
                        ${isVip ? `<div style="font-size: 11px; color: #666; margin-top: 4px; text-decoration: line-through;">${formattedOldPrice} UZS</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 10px; color: var(--accent); text-transform: uppercase;">VIP Klub</span>
                        <span class="gold-text" style="font-size: 18px; font-weight: 700;">${Number(p.vip_price || p.price * 0.8).toLocaleString()}</span>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <button class="liquid-glass" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px;" onclick="toggleLike(${p.id})">
                        <i class="fa-${isLiked(p.id) ? 'solid' : 'regular'} fa-heart" style="${isLiked(p.id) ? 'color: #ef4444;' : ''}"></i>
                    </button>
                    <button class="btn-primary" style="flex: 1; height: 60px; font-size: 15px; border-radius: 20px;" onclick="addToCart(${p.id})">SAVATCHAGA QO'SHISH</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('page-content').innerHTML = detailPage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
};

// toggleLike is already defined in Likes system (line 630)

window.addToCart = function(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    let cart = JSON.parse(localStorage.getItem('durlovely_cart') || '[]');
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('durlovely_cart', JSON.stringify(cart));
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    showAlert(`${product.name} savatchaga qo'shildi!`);
};

window.removeFromCart = function(id) {
    let cart = JSON.parse(localStorage.getItem('durlovely_cart') || '[]');
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('durlovely_cart', JSON.stringify(cart));
    navigate('cart');
};

window.renderCart = function() {
    const cartList = document.getElementById('cart-list');
    const cartEmpty = document.getElementById('cart-empty');
    const cartSummary = document.getElementById('cart-summary');
    const totalPriceEl = document.getElementById('total-price');
    
    const cart = JSON.parse(localStorage.getItem('durlovely_cart') || '[]');
    
    if (cart.length === 0) {
        cartList.innerHTML = '';
        cartEmpty.classList.remove('hide');
        cartSummary.classList.add('hide');
        return;
    }
    
    cartEmpty.classList.add('hide');
    cartSummary.classList.remove('hide');
    
    let total = 0;
    cartList.innerHTML = cart.map(item => {
        const itemPrice = parseInt(String(item.price).replace(/,/g, ''));
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;
        const productImg = item.image || item.img || '../shared-assets/assets/images/logo.png';
        return `
            <div class="liquid-glass animate-fluid" style="padding: 15px; display: flex; gap: 15px; align-items: center; border-color: rgba(255,255,255,0.03);">
                <div style="width: 70px; height: 70px; border-radius: 15px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);">
                    <img src="${productImg}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <h4 style="font-size: 14px; font-weight: 600; color: #fff;">${item.name}</h4>
                    <div style="color: var(--accent); font-weight: 700; margin-top: 5px;">${Number(parseInt(String(item.price).replace(/,/g, ''))).toLocaleString()} UZS</div>
                    <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px;">
                        <button onclick="updateQuantity(${item.id}, -1)" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border); background: none; color: #fff;">-</button>
                        <span style="font-weight: 600;">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border); background: none; color: #fff;">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: #ef4444; font-size: 18px; padding: 10px;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join('');
    
}

async function proceedWithOrder(orderData, total) {
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (res.ok) {
            const result = await res.json();
            const orderId = result.order.id;
            localStorage.setItem('durlovely_cart', '[]');
            showPaymentMethodSelection(orderId, total);
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }
    } catch (e) {
        console.error("Order submission failed:", e);
        showAlert("Xatolik yuz berdi. Iltimos qaytadan urunib ko'ring.");
    }
}

window.updateQuantity = function(id, delta) {
    let cart = JSON.parse(localStorage.getItem('durlovely_cart') || '[]');
    const item = cart.find(x => x.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(x => x.id !== id);
        }
    }
    localStorage.setItem('durlovely_cart', JSON.stringify(cart));
    renderCart();
    if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
};

window.showCheckout = function() {
    document.getElementById('cart-items-section').classList.add('hide');
    document.getElementById('checkout-section').classList.remove('hide');
};

window.submitOrder = async function() {
    const region = document.getElementById('region').value;
    const address = document.getElementById('address').value;
    const deliveryEl = document.querySelector('input[name="delivery"]:checked');
    const delivery = deliveryEl ? deliveryEl.value : '';
    
    if (!region || !address || !delivery) {
        showAlert("Iltimos, barcha maydonlarni to'ldiring");
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('durlovely_cart') || '[]');
    const total = cart.reduce((sum, item) => {
        const price = parseInt(String(item.price).replace(/,/g, ''));
        return sum + (price * item.quantity);
    }, 0);
    const fullAddress = `${region}, ${address} (${delivery})`;
    const tgId = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user.id : 737113132;
    
    const orderData = {
        name: localStorage.getItem('durlovely_user_auth') || 'Mijoz', 
        phone: localStorage.getItem('durlovely_user_auth') || '',
        address: fullAddress,
        items: cart.map(i => `${i.name} (${i.quantity} ta)`),
        total: total.toLocaleString(),
        tgId: tgId
    };

    if (tg && tg.showPopup && window.location.hostname !== 'localhost') {
        tg.showPopup({
            title: 'Buyurtmani tasdiqlash',
            message: `Jami: ${total.toLocaleString()} UZS\nManzil: ${fullAddress}`,
            buttons: [
                { id: 'ok', type: 'default', text: 'HA' },
                { id: 'cancel', type: 'destructive', text: 'YO\'Q' }
            ]
        }, (id) => {
            if (id === 'ok') proceedWithOrder(orderData, total);
        });
    } else {
        // Browser/Localhost fallback
        if (confirm(`Buyurtmani tasdiqlaysizmi?\nJami: ${total.toLocaleString()} UZS\nManzil: ${fullAddress}`)) {
            proceedWithOrder(orderData, total);
        }
    }
};

window.showPaymentMethodSelection = function(orderId, totalAmount) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.zIndex = '3000';

    modal.innerHTML = `
        <div class="modal-content animate-fluid" style="background: #111; width: 90%; max-width: 400px; padding: 30px; text-align: center;">
            <h3 class="luxury-text gold-text" style="font-size: 1.8rem; margin-bottom: 10px;">TO'LOV TURI</h3>
            <p style="color: #888; font-size: 0.9rem; margin-bottom: 30px;">Buyurtma #${orderId} uchun to'lov turini tanlang</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button class="liquid-glass" onclick="initiatePayment(${orderId}, 'click', ${totalAmount})" style="padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; border-color: #0087ff; background: rgba(0,135,255,0.05);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="https://click.uz/click/images/click-logo.png" style="height: 25px; filter: brightness(0) invert(1);">
                        <span style="font-weight: 700; color: #fff;">CLICK</span>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color: #0087ff;"></i>
                </button>

                <button class="liquid-glass" onclick="initiatePayment(${orderId}, 'payme', ${totalAmount})" style="padding: 20px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; border-color: #00c1af; background: rgba(0,193,175,0.05);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="https://cdn.payme.uz/logo/payme_color.svg" style="height: 25px;">
                        <span style="font-weight: 700; color: #fff;">PAYME</span>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color: #00c1af;"></i>
                </button>

                <button class="btn-primary" onclick="confirmOrderLater(${orderId})" style="margin-top: 10px; background: none; border: 1px solid #444; color: #888;">KEYINROQ TO'LASH</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.confirmOrderLater = async function(orderId) {
    try {
        await fetch(`${API_BASE}/orders/${orderId}/confirm-later`, { method: 'POST' });
    } catch (e) {}
    document.querySelector('.modal-overlay').remove();
    navigate('home');
    showAlert('Buyurtma qabul qilindi. To\'lovni keyinroq amalga oshirishingiz mumkin.');
};

window.initiatePayment = async function(orderId, method, totalAmount) {
    try {
        const res = await fetch(`${API_BASE}/payment/create-invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, method, amount: totalAmount })
        });
        const result = await res.json();
        if (result.success && result.url) {
            if (result.appUrl && window.location.hostname !== 'localhost') {
                // Try direct app opening
                window.location.href = result.appUrl;
                // Fallback to web link after timeout
                setTimeout(() => {
                    if (tg && tg.openLink) tg.openLink(result.url);
                    else window.location.href = result.url;
                }, 2000);
            } else {
                if (tg && tg.openLink) {
                    tg.openLink(result.url);
                } else {
                    window.location.href = result.url;
                }
            }
        } else {
            showAlert("To'lov havolasini yaratishda xatolik");
        }
    } catch (e) {
        console.error("Payment error:", e);
        showAlert("Tizimda xatolik yuz berdi");
    }
};

window.showDurHistory = function() {
    const userAuth = localStorage.getItem('durlovely_user_auth');
    if (!userAuth) return;

    const customer = allCustomers.find(c => c.phone === userAuth || (c.tgId && c.tgId == userAuth));
    const history = (customer && customer.durHistory) ? customer.durHistory : [];

    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <div class="animate-fluid" style="padding: 20px; padding-bottom: 120px;">
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 35px;">
                <i class="fa-solid fa-arrow-left" onclick="navigate('home')" style="font-size: 20px; color: #fff; cursor: pointer;"></i>
                <h2 class="luxury-text gold-text" style="font-size: 2rem;">Dur Tarixi</h2>
            </div>
            
            <div class="liquid-glass" style="padding: 25px; border-radius: 28px; margin-bottom: 30px; text-align: center; background: linear-gradient(135deg, rgba(28,25,23,1), rgba(161,98,7,0.1));">
                <div class="mini-pearl" style="width: 30px; height: 30px; margin-bottom: 15px;"></div>
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">Umumiy Balans</div>
                <div style="font-size: 2.5rem; font-weight: 800; color: #fff;">${(customer && customer.dur ? customer.dur : 0).toFixed(1)} <span style="font-size: 1rem; color: var(--accent);">💎</span></div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${history.length > 0 ? history.map(h => `
                    <div class="liquid-glass" style="padding: 18px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; border-color: rgba(255,255,255,0.03);">
                        <div style="flex: 1;">
                            <div style="font-size: 15px; font-weight: 600; color: #fff;">${h.reason}</div>
                            <div style="font-size: 11px; color: #444; margin-top: 4px; font-weight: 300;">${h.date}</div>
                        </div>
                        <div style="font-weight: 800; color: ${h.amount > 0 ? 'var(--accent)' : '#ef4444'}; font-size: 15px;">
                            ${h.amount > 0 ? '+' : ''}${h.amount} <small style="font-size: 10px; font-weight: 400; opacity: 0.7;">💎</small>
                        </div>
                    </div>
                `).join('') : '<div style="text-align: center; color: #444; padding: 60px;">Sizda hali bonuslar tarixi mavjud emas</div>'}
            </div>
        </div>
    `;
};

window.showNotifications = function() {
    fetch(`${API_BASE}/notifications?v=${Date.now()}`)
        .then(res => res.json())
        .then(notifs => {
            const pageContent = document.getElementById('page-content');
            pageContent.innerHTML = `
                <div class="animate-fluid" style="padding: 20px; padding-bottom: 120px;">
                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 35px;">
                        <i class="fa-solid fa-arrow-left" onclick="navigate('home')" style="font-size: 20px; color: #fff; cursor: pointer;"></i>
                        <h2 class="luxury-text gold-text" style="font-size: 2rem;">Xabarlar</h2>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${notifs.length > 0 ? notifs.map(n => `
                            <div class="liquid-glass" style="padding: 20px; border-radius: 20px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span style="color: var(--accent); font-size: 10px; font-weight: 800; text-transform: uppercase;">Rasmiy</span>
                                    <span style="color: #444; font-size: 10px;">${n.date}</span>
                                </div>
                                <h4 style="color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">${n.title || 'DURLOVELY Янгилик'}</h4>
                                <p style="color: #888; font-size: 14px; line-height: 1.6;">${n.text || n.message}</p>
                            </div>
                        `).join('') : '<div style="text-align: center; color: #444; padding: 100px 20px;">Hozircha yangi xabarlar yo\'q</div>'}
                    </div>
                </div>
            `;
            document.getElementById('notif-badge').style.display = 'none';
        });
};

const DUR_LEVELS = [
    { lvl: 1, min: 0, max: 50, reward: '-10% CHEGIRMA', code: 'DUR10' },
    { lvl: 2, min: 50, max: 150, reward: '-15% CHEGIRMA', code: 'DUR15' },
    { lvl: 3, min: 150, max: 400, reward: 'SOVG\'A TO\'PLAMI', code: 'DURGIFT' },
    { lvl: 4, min: 400, max: 1000, reward: 'VIP STATUS', code: 'DURVIP' }
];

window.updateDurBox = function() {
    const userAuth = localStorage.getItem('durlovely_user_auth');
    if (!userAuth) return;
    
    const customer = allCustomers.find(c => c.phone === userAuth || (c.tgId && c.tgId == userAuth));
    if (!customer) return;

    const dur = customer.dur || 0;
    const durCountEl = document.getElementById('dur-count');
    
    // Check for point increase
    if (lastKnownDur !== -1 && dur > lastKnownDur) {
        animateDurIncrease((dur - lastKnownDur).toFixed(1));
    }
    lastKnownDur = dur;

    if (durCountEl) durCountEl.innerText = dur.toFixed(1);

    let currentLevel = DUR_LEVELS[0];
    for (let l of DUR_LEVELS) {
        if (dur >= l.min) currentLevel = l;
    }

    const badge = document.getElementById('dur-level-badge');
    const progressFill = document.getElementById('dur-progress-fill');
    const progressText = document.getElementById('dur-progress-text');
    const boxIcon = document.getElementById('dur-box-icon');
    const card = document.getElementById('dur-box-card');

    if (badge) badge.innerText = `LVL ${currentLevel.lvl}`;
    
    if (dur >= currentLevel.max && currentLevel.lvl < 4) {
        if (progressText) progressText.innerText = "SOVG'A TAYYOR! OCHISH UCHUN BOSING";
        if (progressFill) progressFill.style.width = "100%";
        if (boxIcon) {
            boxIcon.classList.add('fa-bounce');
            boxIcon.style.color = "#fbbf24";
        }
        if (card) card.style.boxShadow = "0 0 35px rgba(161,98,7,0.5)";
    } else {
        const remaining = currentLevel.max - dur;
        const percent = ((dur - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;
        if (progressText) progressText.innerText = currentLevel.lvl === 4 ? "Siz eng yuqori darajadasiz!" : `Keyingi sovg'agacha ${Math.ceil(remaining)} ball qoldi`;
        if (progressFill) progressFill.style.width = `${Math.min(100, Math.max(5, percent))}%`;
        if (boxIcon) {
            boxIcon.classList.remove('fa-bounce');
            boxIcon.style.color = "var(--accent)";
        }
        if (card) card.style.boxShadow = "none";
    }
};

window.openDurBox = function() {
    const userAuth = localStorage.getItem('durlovely_user_auth');
    const customer = allCustomers.find(c => c.phone === userAuth || (c.tgId && c.tgId == userAuth));
    if (!customer) return;

    const dur = customer.dur || 0;
    let currentLevel = DUR_LEVELS[0];
    for (let l of DUR_LEVELS) {
        if (dur >= l.min) currentLevel = l;
    }

    if (dur < currentLevel.max || currentLevel.lvl >= 4) {
        showAlert(`Sizda hozircha ochish uchun yetarli ball yo'q. Yana ${Math.ceil(currentLevel.max - dur)} ball to'plang!`);
        return;
    }

    // Start opening animation
    const icon = document.getElementById('dur-box-icon');
    icon.classList.remove('fa-bounce');
    icon.classList.add('fa-shake');
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');

    setTimeout(async () => {
        try {
            const res = await fetch(`${API_BASE}/customers/claim-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: customer.phone, cost: currentLevel.max, prize: currentLevel.reward })
            });
            const result = await res.json();
            
            if (result.success) {
                // Show Reward Modal
                document.getElementById('reward-title').innerText = "TABRIKLAYMIZ!";
                document.getElementById('reward-value').innerText = currentLevel.reward;
                document.getElementById('reward-code').innerText = currentLevel.code;
                document.getElementById('reward-modal').classList.remove('hide');
                
                // Refresh data
                initApp();
            } else {
                showAlert(result.message || "Xatolik yuz berdi");
            }
        } catch (e) {
            showAlert("Serverga ulanish xatosi");
        } finally {
            icon.classList.remove('fa-shake');
        }
    }, 1500);
};

window.closeRewardModal = function() {
    document.getElementById('reward-modal').classList.add('hide');
};

let allCustomers = [];

async function initApp() {
    showScreen('splash-screen');

    // 0. LOCALHOST BYPASS (Immediate skip for testing)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const testUser = '+998901234567';
        localStorage.setItem('durlovely_user_auth', testUser);
        localStorage.setItem('durlovely_age_verified_v2', 'true');
        hideAllOnboarding();
        mainApp.classList.remove('hide');
        await fetchProducts();
        navigate('home');
        return; 
    }

    // Await TG Ready just in case
    if (tg && tg.ready) tg.ready();

    // 1. SILENT AUTO-LOGIN CHECK (Priority #1)
    const userAuth = localStorage.getItem('durlovely_user_auth');
    const tgUser = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : null;

    if (userAuth || tgUser) {
        try {
            let customer = null;
            if (userAuth) {
                const res = await fetch(`${API_BASE}/customers/check/phone/${encodeURIComponent(userAuth)}?v=${Date.now()}`, { cache: 'no-store' });
                const result = await res.json();
                if (result.blocked) {
                    showAlert("Hisobingiz bloklangan. Iltimos, admin bilan bog'laning.");
                    localStorage.removeItem('durlovely_user_auth');
                    showScreen('age-gate'); // Fallback to start
                    return;
                }
                if (result.found) customer = result.customer;
                else {
                    localStorage.removeItem('durlovely_user_auth');
                }
            }
            
            // If phone auth failed or not exists, try TG ID
            if (!customer && tgUser) {
                const res = await fetch(`${API_BASE}/customers/check/${tgUser.id}?v=${Date.now()}`, { cache: 'no-store' });
                const result = await res.json();
                if (result.blocked) {
                    showAlert("Hisobingiz bloklangan. Iltimos, admin bilan bog'laning.");
                    showScreen('age-gate');
                    return;
                }
                if (result.found) {
                    customer = result.customer;
                    localStorage.setItem('durlovely_user_auth', customer.phone);
                }
            }

            if (customer) {
                hideAllOnboarding();
                mainApp.classList.remove('hide');
                localStorage.setItem('durlovely_vip_status', customer.isVip ? 'true' : 'false');
                
                await fetchProducts();
                navigate('home');
                updateClientContext(customer);
                return;
            }
        } catch(e) {
            console.error('Auto-login failed:', e);
        }
    }

    // 2. DEFAULT ONBOARDING (Priority #2)
    const userAgeVerified = localStorage.getItem('durlovely_age_verified_v2');
    if (!userAgeVerified) {
        showScreen('age-gate');
    } else {
        showScreen('security');
    }
    
    await fetchProducts();
}

function hideAllOnboarding() {
    ['splash-screen', 'age-gate', 'security', 'auth-screen', 'birthday-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hide');
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });
}

function showScreen(id) {
    hideAllOnboarding();
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hide');
        el.classList.add('active');
        el.style.display = 'flex';
    }
}

async function updateClientContext(customer) {
    const durEl = document.getElementById('dur-count');
    if (durEl) durEl.textContent = (customer.dur || 0).toFixed(1);

    try {
        const res = await fetch(`${API_BASE}/customers?v=${Date.now()}`);
        allCustomers = await res.json();
        updateDurBox();
    } catch(e) {}

    fetch(`${API_BASE}/notifications?v=${Date.now()}`)
        .then(res => res.json())
        .then(notifs => {
            if (notifs.length > 0) {
                const badge = document.getElementById('notif-badge');
                if (badge) badge.style.display = 'block';
            }
        });
}

initApp();
