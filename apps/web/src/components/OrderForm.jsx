import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { productService } from '@/services/productService.js';
import { orderService } from '@/services/orderService.js';
import { invoiceService } from '@/services/invoiceService.js';

const OrderForm = ({ open, onOpenChange, order, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    event_name: '',
    event_date: '',
    event_location: '',
    product_id: '',
    adjusted_price: ''
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (order) {
      setFormData({
        customer_name: order.customer_name || '',
        phone_number: order.phone_number || '',
        event_name: order.event_name || '',
        event_date: order.event_date || '',
        event_location: order.event_location || '',
        product_id: order.product_id || '',
        adjusted_price: ''
      });
    } else {
      setFormData({
        customer_name: '',
        phone_number: '',
        event_name: '',
        event_date: '',
        event_location: '',
        product_id: '',
        adjusted_price: ''
      });
      setSelectedProduct(null);
    }
  }, [order, open]);

  const loadProducts = async () => {
    try {
      const records = await productService.listAll();
      setProducts(records);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: productId });
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalPrice = formData.adjusted_price 
        ? parseFloat(formData.adjusted_price) 
        : selectedProduct?.base_price || 0;

      if (order) {
        await orderService.update(order.id, {
          customer_name: formData.customer_name,
          phone_number: formData.phone_number,
          event_name: formData.event_name,
          event_date: formData.event_date,
          event_location: formData.event_location,
          product_id: formData.product_id
        });
        toast.success('Order updated successfully');
      } else {
        const invoiceNumber = generateInvoiceNumber();

        const orderData = {
          customer_name: formData.customer_name,
          phone_number: formData.phone_number,
          event_name: formData.event_name,
          event_date: formData.event_date,
          event_location: formData.event_location,
          product_id: formData.product_id,
          status: 'Pending',
          invoice_number: invoiceNumber,
          items: [{
            product_id: formData.product_id,
            base_price: selectedProduct?.base_price || 0,
            adjusted_price: formData.adjusted_price ? parseFloat(formData.adjusted_price) : null,
            quantity: 1
          }]
        };

        const newOrderRes = await orderService.create(orderData);
        const newOrder = newOrderRes.data;

        await invoiceService.create({
          order_id: newOrder.id,
          invoice_number: invoiceNumber,
          total_amount: finalPrice
        });

        toast.success('Order created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Edit Order' : 'Create New Order'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
              className="text-gray-900"
              placeholder="Anika Bergström"
            />
          </div>

          <div>
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
              className="text-gray-900"
              placeholder="+62 812 3456 7890"
            />
          </div>

          <div>
            <Label htmlFor="event_name">Event Name *</Label>
            <Input
              id="event_name"
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              required
              className="text-gray-900"
              placeholder="Wedding Reception"
            />
          </div>

          <div>
            <Label htmlFor="event_date">Event Date *</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
              className="text-gray-900"
            />
          </div>

          <div>
            <Label htmlFor="event_location">Event Location *</Label>
            <Input
              id="event_location"
              value={formData.event_location}
              onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
              required
              className="text-gray-900"
              placeholder="Grand Ballroom, Jakarta"
            />
          </div>

          <div>
            <Label htmlFor="product_id">Package *</Label>
            <Select
              value={formData.product_id}
              onValueChange={handleProductChange}
              required
            >
              <SelectTrigger className="text-gray-900">
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.package_name} - IDR {product.base_price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Base Price: IDR {selectedProduct.base_price.toLocaleString()}</p>
            </div>
          )}

          {!order && (
            <div>
              <Label htmlFor="adjusted_price">Adjusted Price (Optional)</Label>
              <Input
                id="adjusted_price"
                type="number"
                value={formData.adjusted_price}
                onChange={(e) => setFormData({ ...formData, adjusted_price: e.target.value })}
                min="0"
                step="0.01"
                className="text-gray-900"
                placeholder="Leave empty to use base price"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a custom price for discounts or special pricing
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : order ? 'Update' : 'Create Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;