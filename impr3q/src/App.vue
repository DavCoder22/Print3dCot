<script setup lang="ts">
import { ref, computed } from 'vue'

const proformaRef = ref<HTMLElement>()
import jsPDF from 'jspdf'

const activeSection = ref<string>('home')
const isCrochetMode = ref(false)

const navigateTo = (section: string) => {
  activeSection.value = section
  if (section === 'crochet') {
    isCrochetMode.value = true
  } else {
    isCrochetMode.value = false
  }
}

interface Material {
  value: string
  label: string
  costPerCm3: number
  type: string
}

const materials: Material[] = [
  { value: 'pla', label: 'PLA (Filamento)', costPerCm3: 0.05, type: 'filament' },
  { value: 'abs', label: 'ABS (Filamento)', costPerCm3: 0.07, type: 'filament' },
  { value: 'petg', label: 'PETG (Filamento)', costPerCm3: 0.08, type: 'filament' },
  { value: 'tpu', label: 'TPU (Filamento)', costPerCm3: 0.09, type: 'filament' },
  { value: 'standard-resin', label: 'Resina Estándar', costPerCm3: 0.15, type: 'resin' },
  { value: 'tough-resin', label: 'Resina Resistente', costPerCm3: 0.18, type: 'resin' },
  { value: 'flexible-resin', label: 'Resina Flexible', costPerCm3: 0.20, type: 'resin' }
]

const IVA = 1.15
const HOURLY_RATE = 3
const SHIPPING_COST = 3

interface PrintItem {
  id: number
  length: number
  width: number
  height: number
  material: string
  quantity: number
  printingTime: number
  complexity: number
  description: string
  imageUrl: string
  additionalImages: string[]
}

interface ProformaItem {
  id: number
  description: string
  material: string
  volume: number
  quantity: number
  printingTime: number
  complexityFactor: number
  unitCost: number
  totalCost: number
  imageUrl: string
}

interface Proforma {
  customerName: string
  customerEmail: string
  serviceType: string
  details: string
  items: ProformaItem[]
  subtotal: number
  shippingCost: number
  total: number
  date: string
}

interface StockOrder {
  id: number
  name: string
  price: number
  description: string
  imageUrl: string
  stock: number
}

const stockOrders = ref<StockOrder[]>([
  { id: 1, name: 'Osito Amor', price: 15, description: 'Hermoso osito de gancho hecho a mano', imageUrl: '', stock: 5 },
  { id: 2, name: 'Flores de Campo', price: 12, description: 'Ramo de flores tejidas en crochet', imageUrl: '', stock: 8 },
  { id: 3, name: 'Cojín Corazón', price: 18, description: 'Cojín en forma de corazón suave', imageUrl: '', stock: 3 }
])

const formData = ref({ name: '', email: '', service: '', shipping: false })
const items = ref<PrintItem[]>([createEmptyItem()])
const itemCounter = ref(1)

function createEmptyItem(): PrintItem {
  return { id: 0, length: 0, width: 0, height: 0, material: '', quantity: 1, printingTime: 0, complexity: 1.0, description: '', imageUrl: '', additionalImages: [] }
}

function addItem() {
  itemCounter.value++
  items.value.push({ ...createEmptyItem(), id: itemCounter.value })
}

function removeItem(index: number) {
  if (items.value.length > 1) items.value.splice(index, 1)
}

function calculateItemCost(item: PrintItem) {
  const volume = item.length * item.width * item.height
  const material = materials.find(m => m.value === item.material)
  const materialCost = material ? volume * material.costPerCm3 * IVA : 0
  const timeCost = item.printingTime * HOURLY_RATE
  const unitCost = (materialCost + timeCost) * item.complexity
  const totalCost = unitCost * item.quantity
  return { unitCost, totalCost, volume }
}

const orderSummary = computed(() => {
  return items.value.map((item, index) => {
    const { unitCost, totalCost, volume } = calculateItemCost(item)
    const material = materials.find(m => m.value === item.material)
    return { index, id: item.id, description: item.description || `Item ${index + 1}`, material: material ? material.label : '', volume, quantity: item.quantity, printingTime: item.printingTime, complexity: item.complexity, unitCost, totalCost, imageUrl: item.imageUrl, additionalImages: item.additionalImages }
  })
})

const subtotal = computed(() => orderSummary.value.reduce((sum, item) => sum + item.totalCost, 0))
const shippingCost = computed(() => formData.value.shipping ? SHIPPING_COST : 0)
const totalOrder = computed(() => subtotal.value + shippingCost.value)

const proforma = ref<Proforma>({ customerName: '', customerEmail: '', serviceType: '', details: '', items: [], subtotal: 0, shippingCost: 0, total: 0, date: '' })

const validateForm = () => {
  if (!formData.value.name.trim()) { alert('El nombre es requerido.'); return false }
  if (!formData.value.email.trim()) { alert('El correo electrónico es requerido.'); return false }
  if (!formData.value.service) { alert('Selecciona un tipo de servicio.'); return false }
  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i]
    if (item.length <= 0 || item.width <= 0 || item.height <= 0) { alert(`Item ${i + 1}: Las dimensiones deben ser mayores a 0.`); return false }
    if (!item.material) { alert(`Item ${i + 1}: Selecciona un material.`); return false }
    if (item.quantity <= 0) { alert(`Item ${i + 1}: La cantidad debe ser mayor a 0.`); return false }
  }
  return true
}

const submitQuote = () => {
  if (!validateForm()) return
  proforma.value = {
    customerName: formData.value.name, customerEmail: formData.value.email, serviceType: formData.value.service,
    details: items.value.map(i => i.description).filter(d => d).join('; '),
    items: orderSummary.value.map(item => ({ id: item.id, description: item.description || `Item ${item.index + 1}`, material: item.material, volume: item.volume, quantity: item.quantity, printingTime: item.printingTime, complexityFactor: item.complexity, unitCost: item.unitCost, totalCost: item.totalCost, imageUrl: item.imageUrl })),
    subtotal: subtotal.value, shippingCost: shippingCost.value, total: totalOrder.value, date: new Date().toLocaleDateString()
  }
  activeSection.value = 'proforma'
}

const generatePDF = () => {
  if (!proformaRef.value) return
  proforma.value.date = new Date().toLocaleDateString()
  const doc = new jsPDF()
  doc.html(proformaRef.value, { callback: (doc) => { doc.save('proforma.pdf') }, x: 10, y: 10, width: 190, windowWidth: 800 })
}

const resetForm = () => { formData.value = { name: '', email: '', service: '', shipping: false }; items.value = [createEmptyItem()]; activeSection.value = 'quote' }

function handleImageUpload(event: Event, index: number) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) { const reader = new FileReader(); reader.onload = (e) => { items.value[index].imageUrl = e.target?.result as string }; reader.readAsDataURL(file) }
}

function handleAdditionalImageUpload(event: Event, itemIndex: number) {
  const files = (event.target as HTMLInputElement).files
  if (files) { Array.from(files).forEach(file => { const reader = new FileReader(); reader.onload = (e) => { if (items.value[itemIndex].additionalImages.length < 5) items.value[itemIndex].additionalImages.push(e.target?.result as string) }; reader.readAsDataURL(file) }) }
}

function removeAdditionalImage(itemIndex: number, imgIndex: number) { items.value[itemIndex].additionalImages.splice(imgIndex, 1) }
function removeMainImage(index: number) { items.value[index].imageUrl = '' }
function handleStockImageUpload(event: Event, orderId: number) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) { const reader = new FileReader(); reader.onload = (e) => { const order = stockOrders.value.find(o => o.id === orderId); if (order) order.imageUrl = e.target?.result as string }; reader.readAsDataURL(file) }
}
</script>

<template>
  <div id="app" :class="{ 'crochet-mode': isCrochetMode }">
    <svg style="display: none;">
      <defs>
        <symbol id="icon-3dprint" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2z"/></symbol>
        <symbol id="icon-keycap" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></symbol>
        <symbol id="icon-service" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></symbol>
        <symbol id="icon-gift" viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.83 0 1.5.67 1.5 1.5S9.83 7 9 7 7.5 6.33 7.5 5.5 8.17 4 9 4zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></symbol>
        <symbol id="icon-upload" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></symbol>
        <symbol id="icon-image" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></symbol>
        <symbol id="icon-add" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></symbol>
        <symbol id="icon-remove" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></symbol>
        <symbol id="icon-heart" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></symbol>
      </defs>
    </svg>

    <header class="header">
      <div class="container header-content">
        <div class="logo">
          <h1 v-if="!isCrochetMode">IMPR<span class="highlight">3</span>Q</h1>
          <h1 v-else><span class="highlight">PELUCH</span></h1>
        </div>
        <nav class="nav">
          <button @click="navigateTo('crochet')" :class="{ active: activeSection === 'crochet' }" class="nav-btn crochet-btn">
            <svg class="nav-icon"><use href="#icon-heart"/></svg>
            Crochet
          </button>
          <button @click="navigateTo('quote')" :class="{ active: activeSection === 'quote' }" class="nav-btn">
            Cotizar
          </button>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        <section v-if="activeSection === 'home'" class="section">
          <div class="hero-box">
            <div class="hero-text">
              <h2>Impresión 3D<br>de Alta Calidad</h2>
              <p class="subtitle">Transformamos tus ideas en realidad</p>
              <button @click="navigateTo('quote')" class="btn-primary">Solicitar Cotización</button>
            </div>
            <div class="hero-features">
              <div class="feature-card">
                <svg class="feature-icon"><use href="#icon-3dprint"/></svg>
                <h3>Impresión 3D</h3>
                <p>Prototipos, figuras y piezas personalizadas</p>
              </div>
              <div class="feature-card">
                <svg class="feature-icon"><use href="#icon-keycap"/></svg>
                <h3>Keycaps</h3>
                <p>Teclados mecánicos personalizados</p>
              </div>
              <div class="feature-card">
                <svg class="feature-icon"><use href="#icon-service"/></svg>
                <h3>Servicios</h3>
                <p>Reparación de laptops y autos</p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeSection === 'crochet'" class="section crochet-section">
          <div class="crochet-header">
            <span class="crochet-icon">🧶</span>
            <h2>Peluchitos</h2>
            <p class="subtitle">Hechos a mano con mucho amor ♥</p>
          </div>
          
          <div class="content-box intro-box">
            <p>Descubre nuestra colección de peluches tejidos a mano. Cada pieza es única y especial, perfecta para regalar amor y ternura.</p>
          </div>

          <div class="content-box stock-box">
            <h3>Pedidos de Stock</h3>
            <p class="stock-note">Productos predefinidos disponibles. También aceptamos pedidos personalizados.</p>
            <div class="stock-grid">
              <div v-for="order in stockOrders" :key="order.id" class="stock-card">
                <div class="stock-image-container">
                  <div v-if="order.imageUrl" class="stock-image-preview">
                    <img :src="order.imageUrl" :alt="order.name" class="stock-image">
                    <button @click="order.imageUrl = ''" class="remove-stock-image">×</button>
                  </div>
                  <div v-else class="stock-image-placeholder">
                    <svg class="placeholder-icon"><use href="#icon-image"/></svg>
                    <p>Sin imagen</p>
                    <label class="upload-stock-btn">
                      <svg class="upload-icon"><use href="#icon-upload"/></svg>
                      Subir
                      <input type="file" accept="image/*" @change="handleStockImageUpload($event, order.id)" hidden>
                    </label>
                  </div>
                </div>
                <div class="stock-info">
                  <h4>{{ order.name }}</h4>
                  <p class="stock-description">{{ order.description }}</p>
                  <div class="stock-details">
                    <span class="stock-price">${{ order.price }}</span>
                    <span class="stock-quantity">Stock: {{ order.stock }}</span>
                  </div>
                </div>
                <button class="order-stock-btn">Solicitar</button>
              </div>
            </div>
          </div>

          <div class="content-box custom-box">
            <h3>Pedido Personalizado</h3>
            <p>¿Tienes una idea especial? Cuéntanos y te haremos una cotización única.</p>
            <button @click="navigateTo('quote')" class="btn-primary">Solicitar Cotización</button>
          </div>
        </section>

        <section v-if="activeSection === 'quote'" class="section">
          <h2>Solicita tu Cotización</h2>
          <form class="quote-form" @submit.prevent="submitQuote">
            <div class="content-box form-box">
              <h3 class="section-title">Datos del Cliente</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre completo:</label>
                  <input type="text" v-model="formData.name" placeholder="Tu nombre" required>
                </div>
                <div class="form-group">
                  <label>Correo electrónico:</label>
                  <input type="email" v-model="formData.email" placeholder="tu@correo.com" required>
                </div>
              </div>
            </div>

            <div class="content-box form-box">
              <h3 class="section-title">Tipo de Servicio</h3>
              <div class="form-group">
                <label>Servicio:</label>
                <select v-model="formData.service" required>
                  <option value="">Selecciona un servicio</option>
                  <option value="3d-printing">Impresión 3D</option>
                  <option value="custom">Objeto Personalizado</option>
                  <option value="laptop">Restauración de Laptop</option>
                  <option value="car-parts">Restauración de Piezas de Carro</option>
                  <option value="crochet">Regalos en Crochet</option>
                </select>
              </div>
            </div>

            <div v-if="formData.service === '3d-printing' || formData.service === 'custom'" class="content-box items-box">
              <h3>Items del Pedido</h3>
              
              <div v-for="(item, index) in items" :key="item.id" class="item-card">
                <div class="item-header">
                  <h4>Item {{ index + 1 }}</h4>
                  <button type="button" v-if="items.length > 1" @click="removeItem(index)" class="btn-remove">×</button>
                </div>
                
                <div class="item-content">
                  <div class="form-group">
                    <label>Descripción:</label>
                    <input type="text" v-model="item.description" placeholder="Descripción del item">
                  </div>
                  
                  <div class="dimensions-row">
                    <div class="form-group">
                      <label>Largo (cm):</label>
                      <input type="number" v-model.number="item.length" min="0" step="0.1" required>
                    </div>
                    <div class="form-group">
                      <label>Ancho (cm):</label>
                      <input type="number" v-model.number="item.width" min="0" step="0.1" required>
                    </div>
                    <div class="form-group">
                      <label>Alto (cm):</label>
                      <input type="number" v-model.number="item.height" min="0" step="0.1" required>
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>Material:</label>
                      <select v-model="item.material" required>
                        <option value="">Selecciona material</option>
                        <option v-for="mat in materials" :key="mat.value" :value="mat.value">{{ mat.label }}</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Cantidad:</label>
                      <input type="number" v-model.number="item.quantity" min="1" required>
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>Tiempo (horas):</label>
                      <input type="number" v-model.number="item.printingTime" min="0" step="0.1" required>
                    </div>
                    <div class="form-group">
                      <label>Complejidad:</label>
                      <select v-model.number="item.complexity">
                        <option :value="1.25">25% - Simple</option>
                        <option :value="1.50">50% - Intermedio</option>
                        <option :value="1.75">75% - Complejo</option>
                        <option :value="2.00">100% - Muy Complejo</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div class="image-section">
                  <h4>Imágenes</h4>
                  <div class="main-image">
                    <label>Imagen principal:</label>
                    <div class="image-upload-container">
                      <label v-if="!item.imageUrl" class="image-upload-btn">
                        <svg class="upload-icon"><use href="#icon-upload"/></svg>
                        Seleccionar
                        <input type="file" accept="image/*" @change="handleImageUpload($event, index)" hidden>
                      </label>
                      <div v-else class="image-preview-container">
                        <img :src="item.imageUrl" class="image-preview" alt="Preview">
                        <button type="button" @click="removeMainImage(index)" class="remove-image-btn">×</button>
                        <label class="change-image-btn">
                          Cambiar
                          <input type="file" accept="image/*" @change="handleImageUpload($event, index)" hidden>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="additional-images">
                    <label>Adicionales ({{ item.additionalImages.length }}/5):</label>
                    <div class="additional-images-grid">
                      <div v-for="(img, imgIndex) in item.additionalImages" :key="imgIndex" class="additional-image">
                        <img :src="img" alt="Adicional">
                        <button type="button" @click="removeAdditionalImage(index, imgIndex)" class="remove-additional-btn">×</button>
                      </div>
                      <label v-if="item.additionalImages.length < 5" class="add-image-btn">
                        <svg class="add-icon"><use href="#icon-add"/></svg>
                        <input type="file" accept="image/*" @change="handleAdditionalImageUpload($event, index)" hidden>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="item-cost">
                  <span>Costo estimado:</span>
                  <strong>${{ orderSummary[index]?.totalCost.toFixed(2) || '0.00' }}</strong>
                </div>
              </div>

              <button type="button" @click="addItem" class="btn-add-item">
                <svg class="btn-icon"><use href="#icon-add"/></svg>
                Agregar Item
              </button>
            </div>

            <div v-if="formData.service !== 'crochet'" class="form-group checkbox-box">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.shipping">
                <span>¿Requiere envío? (+$3)</span>
              </label>
            </div>

            <div v-if="formData.service === '3d-printing' || formData.service === 'custom'" class="content-box summary-box">
              <h4>Resumen del Pedido</h4>
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>${{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="summary-row" v-if="shippingCost > 0">
                <span>Envío:</span>
                <span>${{ shippingCost.toFixed(2) }}</span>
              </div>
              <div class="summary-row total">
                <span>Total:</span>
                <span>${{ totalOrder.toFixed(2) }}</span>
              </div>
            </div>

            <button type="submit" class="submit-button">Generar Proforma</button>
          </form>
        </section>

        <section v-if="activeSection === 'proforma'" class="section">
          <h2>Proforma Generada</h2>
          <div ref="proformaRef" class="proforma">
            <div class="proforma-header">
              <h3>IMPR3Q</h3>
              <p>Nota de Venta / Proforma</p>
              <p><strong>Fecha:</strong> {{ proforma.date }}</p>
            </div>
            <div class="proforma-company">
              <p><strong>Empresa:</strong> impr3q</p>
              <p><strong>Dirección:</strong> [Tu dirección]</p>
              <p><strong>Teléfono:</strong> [Tu teléfono]</p>
              <p><strong>Email:</strong> info@impr3q.com</p>
            </div>
            <div class="proforma-details">
              <p><strong>Cliente:</strong> {{ proforma.customerName }}</p>
              <p><strong>Email:</strong> {{ proforma.customerEmail }}</p>
              <p><strong>Servicio:</strong> {{ proforma.serviceType }}</p>
            </div>
            <div class="proforma-breakdown">
              <table class="cost-table">
                <thead>
                  <tr><th>#</th><th>Descripción</th><th>Material</th><th>Cant.</th><th>Total</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in proforma.items" :key="item.id">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ item.description }}</td>
                    <td>{{ item.material }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>${{ item.totalCost.toFixed(2) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr><td colspan="4"><strong>Subtotal:</strong></td><td><strong>${{ proforma.subtotal.toFixed(2) }}</strong></td></tr>
                  <tr v-if="proforma.shippingCost > 0"><td colspan="4"><strong>Envío:</strong></td><td><strong>${{ proforma.shippingCost.toFixed(2) }}</strong></td></tr>
                  <tr><td colspan="4"><strong>TOTAL:</strong></td><td><strong>${{ proforma.total.toFixed(2) }}</strong></td></tr>
                </tfoot>
              </table>
            </div>
            <div class="proforma-footer">
              <p>Esta proforma es válida por 30 días.</p>
              <p><strong>Pago:</strong> 50% al inicio, 50% al entrega.</p>
              <p><strong>Banco Pichincha:</strong> 2206228204 David Malquin</p>
              <p>WhatsApp: +593 0995100326</p>
              <p>Gracias por su preferencia.</p>
              <div class="proforma-actions">
                <button @click="generatePDF" class="submit-button">Generar PDF</button>
                <button @click="resetForm" class="submit-button secondary">Nueva Cotización</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p v-if="!isCrochetMode">&copy; 2024 impr3q - Todos los derechos reservados</p>
        <p v-else>&copy; 2024 Peluch - Hecho con amor</p>
        <p>Contacto: info@impr3q.com</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary: #ff6b35;
  --primary-dark: #e55a25;
  --dark: #2d2d2d;
  --darker: #1a1a1a;
  --light: #f8f8f8;
  --white: #ffffff;
  --gray: #888888;
  --border: #e0e0e0;
}

#app {
  font-family: 'Segoe UI', sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--primary) 0%, var(--darker) 100%);
  color: var(--dark);
}

#app.crochet-mode {
  background: linear-gradient(180deg, #ff85a2 0%, #c77dff 50%, #ffb3c6 100%);
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; width: 100%; }

svg { width: 1em; height: 1em; vertical-align: middle; }

/* HEADER */
.header {
  background: var(--darker);
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

#app.crochet-mode .header { background: linear-gradient(135deg, #831843 0%, #be185d 100%); }

.header-content { display: flex; justify-content: space-between; align-items: center; }

.logo h1 { font-size: 1.6rem; color: var(--white); font-weight: 900; letter-spacing: 2px; }
.logo .highlight { color: var(--primary); }
#app.crochet-mode .logo .highlight { color: #fce7f3; }

.nav { display: flex; gap: 8px; }

.nav-btn {
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--white);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.nav-btn:hover { background: var(--primary); color: var(--white); }
.nav-btn.active { background: var(--primary); color: var(--white); }
#app.crochet-mode .nav-btn { border-color: #ec4899; }
#app.crochet-mode .nav-btn:hover, #app.crochet-mode .nav-btn.active { background: #ec4899; }

/* MAIN */
.main-content { flex: 1; padding: 24px 0; }

.section {
  background: var(--white);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  animation: fadeIn 0.4s ease;
}

#app.crochet-mode .section { border: 2px solid rgba(236, 72, 153, 0.3); }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.section h2 {
  color: var(--dark);
  font-size: 1.6rem;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--primary);
  display: inline-block;
}

#app.crochet-mode .section h2 { border-bottom-color: #ec4899; color: #be185d; }

.subtitle { font-size: 1.1rem; color: var(--primary); margin-bottom: 20px; font-weight: 500; }
#app.crochet-mode .subtitle { color: #ec4899; }

/* HERO */
.hero-box { text-align: center; }

.hero-text h2 { font-size: 2rem; line-height: 1.2; color: var(--dark); }
.hero-text .subtitle { font-size: 1.2rem; margin-bottom: 24px; }

.btn-primary {
  background: var(--primary);
  color: var(--white);
  border: none;
  padding: 12px 28px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
}

.btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4); }
#app.crochet-mode .btn-primary { background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); }
#app.crochet-mode .btn-primary:hover { background: linear-gradient(135deg, #db2777 0%, #ec4899 100%); }

.hero-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; }

.feature-card {
  background: var(--light);
  padding: 24px 16px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.feature-card:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15); }
#app.crochet-mode .feature-card { background: linear-gradient(135deg, #fdf2f8 0%, #fff 100%); }
#app.crochet-mode .feature-card:hover { border-color: #ec4899; }

.feature-icon { width: 40px; height: 40px; color: var(--primary); margin-bottom: 8px; }
#app.crochet-mode .feature-icon { color: #ec4899; }

.feature-card h3 { color: var(--dark); font-size: 1rem; margin-bottom: 4px; }
.feature-card p { font-size: 0.85rem; color: var(--gray); }

/* CONTENT BOXES */
.content-box {
  background: var(--light);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--border);
}

#app.crochet-mode .content-box { background: linear-gradient(135deg, #fff5f5 0%, #fff 100%); border-color: rgba(236, 72, 153, 0.2); }

/* CROCHET SECTION */
.crochet-section { background: linear-gradient(180deg, #fff5f8 0%, #fff 100%) !important; }

.crochet-header { text-align: center; margin-bottom: 24px; padding: 24px; background: linear-gradient(135deg, #fdf2f8 0%, #fff 100%); border-radius: 20px; border: 3px dashed #f9a8d4; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15); }

.crochet-icon { font-size: 3.5rem; display: block; margin-bottom: 12px; animation: bounce 2s infinite; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1)); }

@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.crochet-header h2 { color: #db2777; font-size: 2.2rem; text-shadow: 2px 2px 4px rgba(219, 39, 119, 0.15); margin-bottom: 8px; }
.crochet-header .subtitle { color: #ec4899; font-size: 1.15rem; }

.crochet-section .intro-box { background: linear-gradient(135deg, #fff 0%, #fdf2f8 100%); border: 2px solid #fce7f3; border-radius: 16px; padding: 24px; text-align: center; }
.crochet-section .intro-box p { color: #666; line-height: 1.7; font-size: 1rem; }

.crochet-section .stock-box { background: #fff; border: 2px solid #fce7f3; border-radius: 20px; padding: 24px; }

/* STOCK */
.stock-box h3 { color: #db2777; font-size: 1.4rem; margin-bottom: 8px; text-align: center; }
.stock-note { font-size: 0.95rem; color: var(--gray); margin-bottom: 20px; text-align: center; }

.stock-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

.stock-card {
  background: var(--white);
  border-radius: 20px;
  padding: 20px;
  border: 3px solid #fce7f3;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.1);
}

.stock-card:hover { border-color: #f472b6; box-shadow: 0 10px 30px rgba(236, 72, 153, 0.2); transform: translateY(-6px); }

.stock-image-container { margin-bottom: 16px; }

.stock-image-preview { position: relative; border-radius: 16px; overflow: hidden; }
.stock-image { width: 100%; height: 180px; object-fit: cover; }
.remove-stock-image {
  position: absolute; top: 8px; right: 8px; width: 32px; height: 32px;
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #fff; border: none; border-radius: 50%;
  cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.stock-image-placeholder {
  height: 180px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
  border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #999; border: 2px dashed #f9a8d4;
}

.stock-image-placeholder .placeholder-icon { width: 48px; height: 48px; color: #f9a8d4; }
.stock-image-placeholder p { margin: 8px 0; font-size: 0.9rem; color: #ec4899; }

.upload-stock-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #fff; border-radius: 20px; font-size: 0.85rem;
  cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
}

.upload-stock-btn:hover { background: linear-gradient(135deg, #db2777 0%, #ec4899 100%); transform: scale(1.05); }

.stock-info h4 { color: #db2777; font-size: 1.2rem; margin-bottom: 6px; text-align: center; }
.stock-description { font-size: 0.9rem; color: var(--gray); margin-bottom: 12px; text-align: center; line-height: 1.4; }

.stock-details { display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 16px; padding: 12px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 12px; }
.stock-price { font-size: 1.4rem; font-weight: 700; color: #db2777; }
.stock-quantity { font-size: 0.85rem; color: #ec4899; background: var(--white); padding: 4px 12px; border-radius: 15px; border: 2px solid #fce7f3; }

.order-stock-btn {
  width: 100%; padding: 12px; background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
  color: #fff; border: none; border-radius: 25px; font-size: 1rem; font-weight: 600;
  cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
}

.order-stock-btn:hover { background: linear-gradient(135deg, #db2777 0%, #ec4899 100%); transform: scale(1.02); }

/* CUSTOM BOX */
.custom-box { text-align: center; }
.custom-box h3 { color: #be185d; font-size: 1.2rem; margin-bottom: 8px; }
.custom-box p { color: var(--gray); margin-bottom: 16px; }

/* FORM */
.quote-form { max-width: 700px; margin: 0 auto; }

.form-box .section-title { color: var(--primary); font-size: 1.1rem; margin-bottom: 16px; }
#app.crochet-mode .form-box .section-title { color: #ec4899; }

.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }

.form-group { margin-bottom: 12px; }
.form-group label { display: block; color: var(--dark); font-weight: 600; margin-bottom: 6px; font-size: 0.9rem; }
.form-group input, .form-group select {
  width: 100%; padding: 10px 12px; border: 2px solid var(--border);
  border-radius: 10px; font-size: 0.95rem; transition: all 0.3s ease;
}
.form-group input:focus, .form-group select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1); }
#app.crochet-mode .form-group input:focus, #app.crochet-mode .form-group select:focus { border-color: #ec4899; }

/* ITEMS */
.items-box h3 { color: var(--primary); font-size: 1.2rem; margin-bottom: 16px; }
#app.crochet-mode .items-box h3 { color: #ec4899; }

.item-card {
  background: var(--white); border: 2px solid var(--border); border-radius: 12px;
  padding: 16px; margin-bottom: 16px; transition: all 0.3s ease;
}

.item-card:hover { border-color: var(--primary); }
#app.crochet-mode .item-card:hover { border-color: #ec4899; }

.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.item-header h4 { color: var(--dark); font-size: 1rem; }

.btn-remove {
  width: 32px; height: 32px; background: var(--primary); color: #fff;
  border: none; border-radius: 50%; cursor: pointer; font-size: 1.2rem;
  display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;
}

.btn-remove:hover { background: var(--primary-dark); transform: scale(1.1); }
#app.crochet-mode .btn-remove { background: #ec4899; }
#app.crochet-mode .btn-remove:hover { background: #db2777; }

.item-content { display: grid; gap: 12px; }

.dimensions-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

.image-section { margin-top: 16px; padding-top: 16px; border-top: 2px dashed var(--border); }
.image-section h4 { color: var(--primary); font-size: 1rem; margin-bottom: 12px; }
#app.crochet-mode .image-section h4 { color: #ec4899; }

.main-image { margin-bottom: 12px; }
.main-image label { display: block; color: var(--dark); font-weight: 600; margin-bottom: 6px; font-size: 0.9rem; }

.image-upload-container { position: relative; }

.image-upload-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; padding: 24px; background: var(--light); border: 2px dashed var(--border);
  border-radius: 12px; cursor: pointer; transition: all 0.3s ease; color: var(--gray);
}

.image-upload-btn:hover { border-color: var(--primary); color: var(--primary); }
#app.crochet-mode .image-upload-btn:hover { border-color: #ec4899; color: #ec4899; }

.image-preview-container { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.image-preview { max-width: 150px; max-height: 150px; border-radius: 10px; border: 2px solid var(--border); }

.remove-image-btn {
  width: 28px; height: 28px; background: var(--primary); color: #fff;
  border: none; border-radius: 50%; cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
}

.change-image-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px;
  background: var(--primary); color: #fff; border-radius: 15px; font-size: 0.8rem; cursor: pointer;
}

#app.crochet-mode .change-image-btn { background: #ec4899; }

.additional-images label { display: block; color: var(--dark); font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
.additional-images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }

.additional-image { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid var(--border); }
.additional-image img { width: 100%; height: 100%; object-fit: cover; }

.remove-additional-btn {
  position: absolute; top: 2px; right: 2px; width: 22px; height: 22px;
  background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%;
  cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
}

.add-image-btn {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  background: var(--light); border: 2px dashed var(--border); border-radius: 8px;
  cursor: pointer; color: var(--gray); transition: all 0.3s ease;
}

.add-image-btn:hover { border-color: var(--primary); color: var(--primary); }
#app.crochet-mode .add-image-btn:hover { border-color: #ec4899; color: #ec4899; }

.item-cost {
  margin-top: 16px; padding-top: 12px; border-top: 2px dashed var(--border);
  text-align: right; color: var(--gray); display: flex; justify-content: flex-end; align-items: center; gap: 8px;
}

.item-cost strong { color: var(--primary); font-size: 1.2rem; }
#app.crochet-mode .item-cost strong { color: #ec4899; }

.btn-add-item {
  width: 100%; padding: 12px; background: transparent; border: 2px dashed var(--primary);
  color: var(--primary); border-radius: 25px; font-size: 0.95rem; font-weight: 600;
  cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 6px;
}

.btn-add-item:hover { background: var(--primary); color: #fff; border-style: solid; }
#app.crochet-mode .btn-add-item { border-color: #ec4899; color: #ec4899; }
#app.crochet-mode .btn-add-item:hover { background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); color: #fff; border-style: solid; }

/* CHECKBOX */
.checkbox-box { margin: 16px 0; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; }
.checkbox-label input { width: 18px; height: 18px; accent-color: var(--primary); }
#app.crochet-mode .checkbox-label input { accent-color: #ec4899; }

/* SUMMARY */
.summary-box { background: var(--primary); color: var(--white); border-radius: 12px; padding: 20px; }
#app.crochet-mode .summary-box { background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); }

.summary-box h4 { font-size: 1.1rem; margin-bottom: 12px; }

.summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); font-size: 0.95rem; }
.summary-row.total { border-bottom: none; font-size: 1.2rem; font-weight: 700; padding-top: 12px; }

/* SUBMIT */
.submit-button {
  width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none;
  border-radius: 25px; font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: all 0.3s ease; margin-top: 16px;
}

.submit-button:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4); }
#app.crochet-mode .submit-button { background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); }
#app.crochet-mode .submit-button:hover { background: linear-gradient(135deg, #db2777 0%, #ec4899 100%); }

/* PROFORMA */
.proforma { max-width: 600px; margin: 0 auto; background: var(--light); padding: 24px; border-radius: 12px; border: 3px solid var(--primary); }
#app.crochet-mode .proforma { border-color: #ec4899; }

.proforma-header { text-align: center; margin-bottom: 20px; }
.proforma-header h3 { color: var(--primary); font-size: 1.8rem; }
#app.crochet-mode .proforma-header h3 { color: #ec4899; }

.proforma-company { background: var(--white); padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.proforma-company p { margin: 4px 0; }

.proforma-details { margin-bottom: 16px; }
.proforma-details p { margin: 4px 0; }

.cost-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.cost-table th, .cost-table td { border: 1px solid var(--border); padding: 8px; text-align: left; }
.cost-table th { background: var(--light); color: var(--dark); }
.cost-table tfoot td { font-weight: 700; }

.proforma-footer { margin-top: 20px; text-align: center; }
.proforma-footer p { margin: 6px 0; font-size: 0.9rem; color: var(--gray); }

.proforma-actions { display: flex; gap: 12px; margin-top: 16px; }
.proforma-actions .submit-button { margin-top: 0; flex: 1; }

.secondary { background: #666 !important; }
.secondary:hover { background: #555 !important; }
#app.crochet-mode .secondary { background: linear-gradient(135deg, #831843 0%, #be185d 100%) !important; }

/* FOOTER */
.footer { background: var(--darker); color: var(--white); padding: 20px 0; text-align: center; }
#app.crochet-mode .footer { background: rgba(131, 24, 67, 0.9); }
.footer p { margin: 4px 0; }

/* RESPONSIVE */
@media (max-width: 992px) {
  .stock-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-features { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .container { padding: 0 12px; }
  .hero-features { grid-template-columns: 1fr; }
  .dimensions-row { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .stock-grid { grid-template-columns: 1fr; }
  .proforma-actions { flex-direction: column; }
  .header-content { flex-direction: column; gap: 12px; text-align: center; }
  .logo h1 { font-size: 1.6rem; }
  .section { padding: 16px; margin: 0 8px; }
  .section h2 { font-size: 1.5rem; }
  .hero-text h2 { font-size: 1.6rem; }
  .btn-primary { padding: 10px 20px; font-size: 0.95rem; }
  .nav-btn { padding: 8px 12px; font-size: 0.85rem; }
  .stock-card { padding: 16px; }
  .stock-image, .stock-image-placeholder { height: 150px; }
  .form-box, .items-box, .content-box { padding: 16px; }
}

@media (max-width: 480px) {
  .logo h1 { font-size: 1.3rem; }
  .nav { gap: 6px; }
  .nav-btn { padding: 6px 10px; font-size: 0.8rem; }
  .section { padding: 12px; }
  .section h2 { font-size: 1.3rem; }
  .hero-text h2 { font-size: 1.4rem; }
  .stock-grid { gap: 12px; }
  .stock-card { padding: 12px; }
  .feature-card { padding: 16px 12px; }
  .item-card { padding: 12px; }
  .summary-box { padding: 16px; }
}
</style>