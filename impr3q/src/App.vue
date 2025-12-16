<script setup lang="ts">
import { ref } from 'vue'

const activeSection = ref<string>('home')

const navigateTo = (section: string) => {
  activeSection.value = section
}
</script>

<template>
  <div id="app">
    <!-- Header / Navegación -->
    <header class="header">
      <div class="container">
        <div class="logo">
          <h1>impr<span class="highlight">3</span>q</h1>
        </div>
        <nav class="nav">
          <button 
            @click="navigateTo('home')" 
            :class="{ active: activeSection === 'home' }"
          >
            Inicio
          </button>
          <button 
            @click="navigateTo('impressions')" 
            :class="{ active: activeSection === 'impressions' }"
          >
            Impresiones 3D
          </button>
          <button 
            @click="navigateTo('custom')" 
            :class="{ active: activeSection === 'custom' }"
          >
            Objetos Personalizados
          </button>
          <button 
            @click="navigateTo('services')" 
            :class="{ active: activeSection === 'services' }"
          >
            Servicios
          </button>
          <button 
            @click="navigateTo('quote')" 
            :class="{ active: activeSection === 'quote' }"
            class="cta-button"
          >
            Cotizar
          </button>
        </nav>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="main-content">
      <div class="container">
        <!-- Sección Home -->
        <section v-if="activeSection === 'home'" class="section">
          <div class="hero">
            <h2>Bienvenido a impr3q</h2>
            <p class="subtitle">Tu solución integral en impresión 3D y servicios especializados</p>
            <div class="hero-cards">
              <div class="card">
                <h3>🖨️ Impresiones 3D</h3>
                <p>Transformamos tus ideas en objetos reales con tecnología de impresión 3D de alta calidad</p>
              </div>
              <div class="card">
                <h3>🎨 Objetos Personalizados</h3>
                <p>Diseños únicos adaptados a tus necesidades específicas</p>
              </div>
              <div class="card">
                <h3>🔧 Servicios Técnicos</h3>
                <p>Restauración de laptops y piezas de carro con expertos calificados</p>
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

        <!-- Sección Objetos Personalizados -->
        <section v-if="activeSection === 'custom'" class="section">
          <h2>Objetos Personalizados</h2>
          <p>Creamos objetos únicos diseñados especialmente para ti.</p>
          <div class="service-grid">
            <div class="service-item">
              <h4>Regalos personalizados</h4>
              <p>Llaveros, placas, trofeos con tu diseño</p>
            </div>
            <div class="service-item">
              <h4>Merchandising</h4>
              <p>Productos para tu marca o negocio</p>
            </div>
            <div class="service-item">
              <h4>Decoración</h4>
              <p>Piezas únicas para espacios especiales</p>
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
          <form class="quote-form">
            <div class="form-group">
              <label for="name">Nombre completo:</label>
              <input type="text" id="name" placeholder="Tu nombre" required>
            </div>
            
            <div class="form-group">
              <label for="email">Correo electrónico:</label>
              <input type="email" id="email" placeholder="tu@correo.com" required>
            </div>
            
            <div class="form-group">
              <label for="service">Tipo de servicio:</label>
              <select id="service" required>
                <option value="">Selecciona un servicio</option>
                <option value="3d-printing">Impresión 3D</option>
                <option value="custom">Objeto Personalizado</option>
                <option value="laptop">Restauración de Laptop</option>
                <option value="car-parts">Restauración de Piezas de Carro</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="description">Descripción del proyecto:</label>
              <textarea id="description" rows="5" placeholder="Describe tu proyecto o necesidad..." required></textarea>
            </div>
            
            <button type="submit" class="submit-button">Enviar Cotización</button>
          </form>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 2rem;
  color: #667eea;
  font-weight: bold;
}

.logo .highlight {
  color: #764ba2;
  font-size: 2.5rem;
}

.nav {
  display: flex;
  gap: 1rem;
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
  background: #667eea;
  color: white;
}

.cta-button {
  background: #764ba2 !important;
  color: white !important;
}

.cta-button:hover {
  background: #5a3779 !important;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 2rem 0;
}

.section {
  background: white;
  border-radius: 15px;
  padding: 3rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section h2 {
  color: #667eea;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.section p {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

/* Hero Section */
.hero {
  text-align: center;
}

.subtitle {
  font-size: 1.3rem;
  color: #764ba2;
  margin-bottom: 3rem;
}

.hero-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  border-radius: 10px;
  color: white;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-10px);
}

.card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
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
  border-left: 4px solid #667eea;
  transition: all 0.3s ease;
}

.service-item:hover {
  transform: translateX(10px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.service-item h4 {
  color: #667eea;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

/* Quote Form */
.quote-form {
  max-width: 600px;
  margin: 0 auto;
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
  border-color: #667eea;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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