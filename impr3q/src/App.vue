<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { auth, checkAuth, logout } from './services/auth'
import Login from './components/Login.vue'
import Register from './components/Register.vue'

const proformaRef = ref<HTMLElement>()
import jsPDF from 'jspdf'

const activeSection = ref<string>('home')
const authPage = ref<'login' | 'register'>('login')

onMounted(() => { checkAuth() })

function handleLoggedIn() {
  activeSection.value = 'home'
}

async function handleLogout() {
  await logout()
  activeSection.value = 'home'
}

const navigateTo = (section: string) => {
  activeSection.value = section
}

interface Material {
  value: string
  label: string
  costPerGram: number
  type: string
}

const materials: Material[] = [
  { value: 'pla', label: 'PLA (Filamento)', costPerGram: 0.02, type: 'filament' },
  { value: 'abs', label: 'ABS (Filamento)', costPerGram: 0.02, type: 'filament' },
  { value: 'petg', label: 'PETG (Filamento)', costPerGram: 0.02, type: 'filament' },
  { value: 'tpu', label: 'TPU (Filamento)', costPerGram: 0.025, type: 'filament' },
  { value: 'standard-resin', label: 'Resina Estándar', costPerGram: 0.05, type: 'resin' },
  { value: 'tough-resin', label: 'Resina Resistente', costPerGram: 0.06, type: 'resin' },
  { value: 'flexible-resin', label: 'Resina Flexible', costPerGram: 0.07, type: 'resin' }
]

const IVA = 1.15
const HOURLY_RATE = 0.75
const SHIPPING_COST = 3

interface PrintItem {
  id: number
  weight: number
  material: string
  quantity: number
  printingTime: number
  complexity: number
  description: string
  imageUrl: string
}

interface ProformaItem {
  id: number
  description: string
  material: string
  weight: number
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

const formData = ref({
  name: '',
  email: '',
  service: '',
  shipping: false
})

const items = ref<PrintItem[]>([
  createEmptyItem()
])

const itemCounter = ref(1)

function createEmptyItem(): PrintItem {
  return {
    id: 0,
    weight: 0,
    material: '',
    quantity: 1,
    printingTime: 0,
    complexity: 1.0,
    description: '',
    imageUrl: ''
  }
}

function addItem() {
  itemCounter.value++
  items.value.push({
    ...createEmptyItem(),
    id: itemCounter.value
  })
}

function removeItem(index: number) {
  if (items.value.length > 1) {
    items.value.splice(index, 1)
  }
}

function calculateItemCost(item: PrintItem): { unitCost: number, totalCost: number, weight: number } {
  const weight = item.weight
  const material = materials.find(m => m.value === item.material)
  const materialCost = material ? weight * material.costPerGram * IVA : 0
  const timeCost = item.printingTime * HOURLY_RATE
  const unitCost = (materialCost + timeCost) * item.complexity
  const totalCost = unitCost * item.quantity
  return { unitCost, totalCost, weight }
}

const orderSummary = computed(() => {
  return items.value.map((item, index) => {
    const { unitCost, totalCost, weight } = calculateItemCost(item)
    const material = materials.find(m => m.value === item.material)
    return {
      index,
      id: item.id,
      description: item.description || `Item ${index + 1}`,
      material: material ? material.label : '',
      weight,
      quantity: item.quantity,
      printingTime: item.printingTime,
      complexity: item.complexity,
      unitCost,
      totalCost,
      imageUrl: item.imageUrl
    }
  })
})

const subtotal = computed(() => {
  return orderSummary.value.reduce((sum, item) => sum + item.totalCost, 0)
})

const shippingCost = computed(() => {
  return formData.value.shipping ? SHIPPING_COST : 0
})

const totalOrder = computed(() => {
  return subtotal.value + shippingCost.value
})

const proforma = ref<Proforma>({
  customerName: '',
  customerEmail: '',
  serviceType: '',
  details: '',
  items: [],
  subtotal: 0,
  shippingCost: 0,
  total: 0,
  date: ''
})

const validateForm = () => {
  if (!formData.value.name.trim()) {
    alert('El nombre es requerido.')
    return false
  }
  if (!formData.value.email.trim()) {
    alert('El correo electrónico es requerido.')
    return false
  }
  if (!formData.value.service) {
    alert('Selecciona un tipo de servicio.')
    return false
  }
  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i]
    if (item.weight <= 0) {
      alert(`Item ${i + 1}: Los gramos deben ser mayores a 0.`)
      return false
    }
    if (!item.material) {
      alert(`Item ${i + 1}: Selecciona un material.`)
      return false
    }
    if (item.quantity <= 0) {
      alert(`Item ${i + 1}: La cantidad debe ser mayor a 0.`)
      return false
    }
  }
  return true
}

const submitQuote = () => {
  if (!validateForm()) {
    return
  }
  
  proforma.value = {
    customerName: formData.value.name,
    customerEmail: formData.value.email,
    serviceType: formData.value.service,
    details: items.value.map(i => i.description).filter(d => d).join('; '),
    items: orderSummary.value.map(item => ({
      id: item.id,
      description: item.description || `Item ${item.index + 1}`,
      material: item.material,
      weight: item.weight,
      quantity: item.quantity,
      printingTime: item.printingTime,
      complexityFactor: item.complexity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      imageUrl: item.imageUrl
    })),
    subtotal: subtotal.value,
    shippingCost: shippingCost.value,
    total: totalOrder.value,
    date: new Date().toLocaleDateString()
  }
  activeSection.value = 'proforma'
}

const generatePDF = () => {
  if (!proformaRef.value) return
  proforma.value.date = new Date().toLocaleDateString()
  const doc = new jsPDF()
  doc.html(proformaRef.value, {
    callback: (doc) => {
      doc.save('proforma.pdf')
    },
    x: 10,
    y: 10,
    width: 190,
    windowWidth: 800
  })
}

const resetForm = () => {
  formData.value = { name: '', email: '', service: '', shipping: false }
  items.value = [createEmptyItem()]
  activeSection.value = 'quote'
}

function handleImageUpload(event: Event, index: number) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      items.value[index].imageUrl = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}
</script>

<template>
  <div id="app">
    <div v-if="auth.loading" class="loading-screen">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>

    <Login v-else-if="!auth.user && authPage === 'login'" @register="authPage = 'register'" @loggedIn="handleLoggedIn" />
    <Register v-else-if="!auth.user && authPage === 'register'" @login="authPage = 'login'" @registered="handleLoggedIn" />

    <template v-else>
    <!-- Header -->
    <header class="header">
      <div class="container header-content">
        <div class="logo">
          <h1>IMPR<span class="highlight">3</span>Q</h1>
        </div>
        <nav class="nav">
          <span class="user-greeting" v-if="auth.user">Hola, {{ auth.user.name }}</span>
          <button @click="navigateTo('quote')" :class="{ active: activeSection === 'quote' }" class="cta-button">
            Cotizar
          </button>
          <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
        </nav>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="main-content">
      <div class="container">
        <!-- Sección Home -->
        <section v-if="activeSection === 'home'" class="section">
          <div class="hero">
            <div class="hero-text">
              <h2>Impresión 3D<br>de Alta Calidad</h2>
              <p class="subtitle">Transformamos tus ideas en realidad</p>
              <button @click="navigateTo('quote')" class="btn-primary">Solicitar Cotización</button>
            </div>
            <div class="hero-features">
              <div class="feature">
                <span class="feature-icon">🖨️</span>
                <h3>Impresión 3D</h3>
                <p>Prototipos, figuras y piezas personalizadas</p>
              </div>
              <div class="feature">
                <span class="feature-icon">🎨</span>
                <h3>Keycaps</h3>
                <p>Teclados mecánicos personalizados</p>
              </div>
              <div class="feature">
                <span class="feature-icon">🔧</span>
                <h3>Servicios</h3>
                <p>Reparación de laptops y autos</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Sección Impresiones 3D -->
        <section v-if="activeSection === 'impressions'" class="section">
          <h2>Impresiones 3D</h2>
          <p>Ofrecemos servicios de impresión 3D de alta calidad para todo tipo de proyectos.</p>
          <div class="service-grid">
            <div class="service-item">
              <h4>Prototipos</h4>
              <p>Ideal para validar diseños antes de producción</p>
            </div>
            <div class="service-item">
              <h4>Piezas de repuesto</h4>
              <p>Fabricación de componentes difíciles de conseguir</p>
            </div>
            <div class="service-item">
              <h4>Figuras y maquetas</h4>
              <p>Detalles precisos para coleccionistas</p>
            </div>
          </div>
        </section>

        <!-- Sección Keycaps para Teclados Mecánicos -->
        <section v-if="activeSection === 'custom'" class="section">
          <h2>Keycaps para Teclados Mecánicos</h2>
          <p>Impresos en resina de alta calidad para personalizar tu teclado mecánico.</p>
          <div class="service-grid">
            <div class="service-item">
              <h4>Diseños Personalizados</h4>
              <p>Keycaps con logos, textos o diseños únicos</p>
            </div>
            <div class="service-item">
              <h4>Colores y Materiales</h4>
              <p>Variedad de colores y acabados en resina</p>
            </div>
            <div class="service-item">
              <h4>Layouts Completos</h4>
              <p>Sets completos para diferentes layouts de teclado</p>
            </div>
          </div>
          <div class="image-gallery">
            <h3>Galería de Ejemplos</h3>
            <div class="gallery-grid">
              <div class="gallery-item">
                <div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #666;">Imagen próximamente</div>
                <p>Keycap con diseño personalizado</p>
              </div>
              <div class="gallery-item">
                <div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #666;">Imagen próximamente</div>
                <p>Set completo en resina</p>
              </div>
              <div class="gallery-item">
                <div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #666;">Imagen próximamente</div>
                <p>Variedad de colores</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Sección Servicios -->
        <section v-if="activeSection === 'services'" class="section">
          <h2>Servicios Técnicos</h2>
          <p>Soluciones profesionales para tus equipos y vehículos.</p>
          <div class="service-grid">
            <div class="service-item">
              <h4>💻 Restauración de Laptops</h4>
              <p>Reparación, limpieza y actualización de componentes</p>
            </div>
            <div class="service-item">
              <h4>🚗 Restauración de Piezas</h4>
              <p>Reparación y fabricación de componentes automotrices</p>
            </div>
            <div class="service-item">
              <h4>🔍 Diagnóstico</h4>
              <p>Evaluación completa de problemas técnicos</p>
            </div>
          </div>
        </section>

        <!-- Sección Cotización -->
        <section v-if="activeSection === 'quote'" class="section">
          <h2>Solicita tu Cotización</h2>
          <form class="quote-form" @submit.prevent="submitQuote">
            <div class="form-group">
              <label for="name">Nombre completo:</label>
              <input type="text" id="name" v-model="formData.name" placeholder="Tu nombre" required>
            </div>

            <div class="form-group">
              <label for="email">Correo electrónico:</label>
              <input type="email" id="email" v-model="formData.email" placeholder="tu@correo.com" required>
            </div>

            <div class="form-group">
              <label for="service">Tipo de servicio:</label>
              <select id="service" v-model="formData.service" required>
                <option value="">Selecciona un servicio</option>
                <option value="3d-printing">Impresión 3D</option>
                <option value="custom">Objeto Personalizado</option>
                <option value="laptop">Restauración de Laptop</option>
                <option value="car-parts">Restauración de Piezas de Carro</option>
              </select>
            </div>

            <div v-if="formData.service === '3d-printing' || formData.service === 'custom'" class="items-section">
              <h3>Items del Pedido</h3>
              
              <div v-for="(item, index) in items" :key="item.id" class="item-card">
                <div class="item-header">
                  <h4>Item {{ index + 1 }}</h4>
                  <button type="button" v-if="items.length > 1" @click="removeItem(index)" class="btn-remove">X</button>
                </div>
                
                <div class="item-fields">
                  <div class="form-group">
                    <label>Descripción:</label>
                    <input type="text" v-model="item.description" placeholder="Descripción del item">
                  </div>
                  <div class="form-group">
                      <label>Peso (gramos):</label>
                      <input type="number" v-model.number="item.weight" min="0" step="0.1" required>
                    </div>
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
                  <div class="form-group">
                    <label>Tiempo impresión (horas):</label>
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
                  <div class="form-group">
                    <label>Imagen de referencia:</label>
                    <input type="file" accept="image/*" @change="handleImageUpload($event, index)" class="image-input">
                    <img v-if="item.imageUrl" :src="item.imageUrl" class="image-preview" alt="Vista previa">
                  </div>
                </div>
                
                <div class="item-cost">
                  <span>Costo estimado:</span>
                  <strong>${{ orderSummary[index]?.totalCost.toFixed(2) || '0.00' }}</strong>
                </div>
              </div>

              <button type="button" @click="addItem" class="btn-add-item">+ Agregar Item</button>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" v-model="formData.shipping"> ¿Requiere envío? (+$3)
              </label>
            </div>

            <div class="order-summary">
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

        <!-- Sección Proforma -->
        <section v-if="activeSection === 'proforma'" class="section">
          <h2>Proforma Generada</h2>
          <div ref="proformaRef" class="proforma">
            <div class="proforma-header">
              <img src="/logos/logo.png" alt="Logo" class="logo-img" onerror="this.style.display='none'">
              <h3>impr3q</h3>
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
              <table class="details-table">
                <tbody>
                  <tr>
                    <td><strong>Cliente:</strong></td>
                    <td>{{ proforma.customerName }}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>{{ proforma.customerEmail }}</td>
                  </tr>
                  <tr>
                    <td><strong>Servicio:</strong></td>
                    <td>{{ proforma.serviceType }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="proforma-breakdown">
              <h4>Items del Pedido</h4>
              <table class="cost-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Descripción</th>
                    <th>Material</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                  </tr>
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
                  <tr>
                    <td colspan="4"><strong>Subtotal:</strong></td>
                    <td><strong>${{ proforma.subtotal.toFixed(2) }}</strong></td>
                  </tr>
                  <tr v-if="proforma.shippingCost > 0">
                    <td colspan="4"><strong>Envío:</strong></td>
                    <td><strong>${{ proforma.shippingCost.toFixed(2) }}</strong></td>
                  </tr>
                  <tr>
                    <td colspan="4"><strong>TOTAL:</strong></td>
                    <td><strong>${{ proforma.total.toFixed(2) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="proforma-footer">
              <p>Esta proforma es válida por 30 días.</p>
              <p><strong>Condiciones de Pago:</strong> 50% al inicio del pedido y 50% al momento de la entrega.</p>
              <p><strong>Cuenta de Ahorros Banco Pichincha:</strong> 2206228204 a nombre de David Malquin</p>
              <p>Contáctanos por WhatsApp: +593 0995100326</p>
              <p style="font-size: 0.9em; color: #666;">Gracias por su preferencia.</p>
              <button @click="generatePDF" class="submit-button">Generar PDF</button>
              <button @click="resetForm" class="submit-button secondary">Nueva Cotización</button>
            </div>
            
            <div v-if="proforma.items.some(i => i.imageUrl)" class="proforma-images">
              <h4>Imágenes de Referencia</h4>
              <div class="images-grid">
                <div v-for="(item, idx) in proforma.items.filter(i => i.imageUrl)" :key="idx" class="image-item">
                  <img :src="item.imageUrl" :alt="'Referencia ' + (idx + 1)">
                  <p>Item {{ proforma.items.findIndex(i => i.imageUrl === item.imageUrl) + 1 }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 impr3q - Todos los derechos reservados</p>
        <p>Contacto: info@impr3q.com</p>
      </div>
    </footer>
    </template>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #dc2626 0%, #000000 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

/* Header */
.header {
  background: #000;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 1.8rem;
  color: #fff;
  font-weight: 900;
  letter-spacing: 2px;
}

.logo .highlight {
  color: #dc2626;
}

.nav {
  display: flex;
  gap: 1rem;
}

.cta-button {
  background: #dc2626;
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.nav button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.nav button:hover {
  background: #f0f0f0;
}

.nav button.active {
  background: #dc2626;
  color: white;
}

.cta-button {
  background: #dc2626;
  color: #fff;
}

.cta-button:hover {
  background: #b91c1c;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 2rem 0;
}

.section {
  background: #fff;
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section h2 {
  color: #000;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.section p {
  color: #444;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 2rem;
}

/* Hero Section */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  text-align: left;
}

.hero-text h2 {
  font-size: 2.5rem;
  line-height: 1.1;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: #dc2626;
  color: #fff;
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #b91c1c;
}

.hero-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 2rem;
}

.feature {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.feature-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.feature h3 {
  color: #000;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.feature p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-features {
    grid-template-columns: 1fr;
  }
}

/* Service Grid */
.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.service-item {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 10px;
  border-left: 4px solid #dc2626;
  transition: all 0.3s ease;
}

.service-item:hover {
  transform: translateX(10px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.service-item h4 {
  color: #dc2626;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

/* Image Gallery */
.image-gallery {
  margin-top: 3rem;
}

.image-gallery h3 {
  color: #dc2626;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.gallery-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
}

.gallery-item img {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
  margin-bottom: 0.5rem;
}

.gallery-item p {
  color: #666;
  font-size: 0.9rem;
}

/* Quote Form */
.quote-form {
  max-width: 700px;
  margin: 0 auto;
}

.items-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.items-section h3 {
  color: #dc2626;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.item-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.item-header h4 {
  color: #000000;
  margin: 0;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: #c82333;
}

.item-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.dimensions-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.item-cost {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #ccc;
  text-align: right;
  color: #666;
}

.item-cost strong {
  color: #dc2626;
  font-size: 1.2rem;
  margin-left: 0.5rem;
}

.btn-add-item {
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: 2px dashed #dc2626;
  color: #dc2626;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-item:hover {
  background: #dc2626;
  color: white;
  border-style: solid;
}

.order-summary {
  background: #dc2626;
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
  margin: 1.5rem 0;
}

.order-summary h4 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.summary-row.total {
  border-bottom: none;
  font-size: 1.3rem;
  font-weight: bold;
  padding-top: 1rem;
}

.image-input {
  display: block;
  margin-bottom: 0.5rem;
}

.image-preview {
  max-width: 100px;
  max-height: 100px;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.proforma-images {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 2px solid #dc2626;
}

.proforma-images h4 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.image-item {
  text-align: center;
}

.image-item img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.image-item p {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #dc2626;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #dc2626 0%, #000000 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.submit-button:hover {
  transform: scale(1.05);
}

/* Proforma */
.proforma {
  max-width: 600px;
  margin: 0 auto;
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 10px;
  border: 2px solid #dc2626;
}

.proforma-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-img {
  max-width: 150px;
  height: auto;
  margin-bottom: 1rem;
}

.proforma-header h3 {
  color: #dc2626;
  font-size: 2rem;
}

.proforma-company {
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 5px;
}

.proforma-company p {
  margin: 0.5rem 0;
}

.proforma-details {
  text-align: center;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;
}

.details-table td {
  padding: 0.5rem;
  text-align: left;
}

.details-table td:first-child {
  font-weight: bold;
  width: 40%;
}

.proforma-breakdown {
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 5px;
}

.proforma-breakdown h4 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.cost-table {
  width: 100%;
  border-collapse: collapse;
}

.cost-table th, .cost-table td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.cost-table th {
  background-color: #f2f2f2;
  color: #333;
}

.cost-table tfoot td {
  font-weight: bold;
}

.proforma-footer {
  margin-top: 2rem;
  text-align: center;
}

.secondary {
  background: #6c757d !important;
  margin-left: 1rem;
}

.secondary:hover {
  background: #5a6268 !important;
}

/* Footer */
.footer {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2rem 0;
  text-align: center;
  margin-top: 2rem;
}

.footer p {
  margin: 0.5rem 0;
}

/* Responsive */
.loading-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dc2626 0%, #000000 100%);
  color: #fff;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-greeting {
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.btn-logout {
  background: transparent;
  border: 1px solid #dc2626;
  color: #dc2626;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: #dc2626;
  color: #fff;
}

@media (max-width: 768px) {
  .nav {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav button {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  
  .section {
    padding: 2rem 1rem;
  }
  
  .section h2 {
    font-size: 2rem;
  }
}
</style>