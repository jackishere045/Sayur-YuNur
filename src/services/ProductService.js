// src/services/productService.js
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../firebase';

class ProductService {
  constructor() {
    this.collectionName = 'products';
    this.storageFolder = 'products';
  }

  // Get all products
  async getAllProducts() {
    try {
      const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Gagal mengambil data produk');
    }
  }

  // Get product by ID
  async getProductById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Produk tidak ditemukan');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Gagal mengambil data produk');
    }
  }

  // Get products by category
  async getProductsByCategory(category) {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw new Error('Gagal mengambil data produk berdasarkan kategori');
    }
  }

  // Upload image to Firebase Storage
  async uploadImage(file, customFileName = null) {
    if (!file) return null;
    
    try {
      const fileName = customFileName || `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `${this.storageFolder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Gagal mengupload gambar');
    }
  }

  // Delete image from Firebase Storage
  async deleteImage(imageUrl) {
    if (!imageUrl || !imageUrl.includes('firebase')) return;
    
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathStart = url.pathname.indexOf('/o/') + 3;
      const pathEnd = url.pathname.indexOf('?');
      const fullPath = decodeURIComponent(url.pathname.slice(pathStart, pathEnd));
      
      const imageRef = ref(storage, fullPath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for image deletion to avoid blocking other operations
    }
  }

  // Add new product
  async addProduct(productData) {
    try {
      const docData = {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      return {
        id: docRef.id,
        ...docData
      };
    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error('Gagal menambahkan produk');
    }
  }

  // Update existing product
  async updateProduct(id, productData) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...productData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      
      return {
        id,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Gagal memperbarui produk');
    }
  }

  // Delete product
  async deleteProduct(id, imageUrl = null) {
    try {
      // Delete image first if exists
      if (imageUrl) {
        await this.deleteImage(imageUrl);
      }

      // Delete document
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Gagal menghapus produk');
    }
  }

  // Update product stock
  async updateStock(id, newStock) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw new Error('Gagal memperbarui stok');
    }
  }

  // Search products
  async searchProducts(searchTerm) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter on client side
      return products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Gagal mencari produk');
    }
  }

  // Get products with low stock (less than specified amount)
  async getLowStockProducts(threshold = 5) {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return products.filter(product => product.stock <= threshold);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw new Error('Gagal mengambil produk dengan stok rendah');
    }
  }

  // Get category statistics
  async getCategoryStats() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      
      const categoryStats = {};
      let totalProducts = 0;
      let totalValue = 0;

      querySnapshot.docs.forEach(doc => {
        const product = doc.data();
        const category = product.category;
        
        if (!categoryStats[category]) {
          categoryStats[category] = {
            count: 0,
            totalStock: 0,
            totalValue: 0
          };
        }
        
        categoryStats[category].count++;
        categoryStats[category].totalStock += product.stock;
        categoryStats[category].totalValue += product.price * product.stock;
        
        totalProducts++;
        totalValue += product.price * product.stock;
      });

      return {
        categoryStats,
        totalProducts,
        totalValue
      };
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw new Error('Gagal mengambil statistik kategori');
    }
  }

  // Validate product data
  validateProductData(productData) {
    const errors = [];

    if (!productData.name || productData.name.trim() === '') {
      errors.push('Nama produk harus diisi');
    }

    if (!productData.category || productData.category.trim() === '') {
      errors.push('Kategori harus dipilih');
    }

    if (!productData.price || productData.price <= 0) {
      errors.push('Harga harus lebih dari 0');
    }

    if (productData.stock < 0) {
      errors.push('Stok tidak boleh negatif');
    }

    return errors;
  }
}

// Create and export singleton instance
const productService = new ProductService();
export default productService;