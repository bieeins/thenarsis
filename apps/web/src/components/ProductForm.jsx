import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const ProductForm = ({ open, onOpenChange, product, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    package_name: '',
    description: '',
    base_price: '',
    category: 'Photography'
  });

  useEffect(() => {
    if (product) {
      setFormData({
        package_name: product.package_name || '',
        description: product.description || '',
        base_price: product.base_price || '',
        category: product.category || 'Photography'
      });
    } else {
      setFormData({
        package_name: '',
        description: '',
        base_price: '',
        category: 'Photography'
      });
    }
  }, [product, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        package_name: formData.package_name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        category: formData.category
      };

      if (product) {
        await productService.update(product.id, data);
        toast.success('Product updated successfully');
      } else {
        await productService.create(data);
        toast.success('Product created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="package_name">Package Name *</Label>
            <Input
              id="package_name"
              value={formData.package_name}
              onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
              required
              className="text-gray-900"
              placeholder="e.g., Wedding Photography Premium"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="text-gray-900"
              placeholder="Package details and inclusions"
            />
          </div>

          <div>
            <Label htmlFor="base_price">Base Price (IDR) *</Label>
            <Input
              id="base_price"
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              required
              min="0"
              step="0.01"
              className="text-gray-900"
              placeholder="5000000"
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Photography">Photography</SelectItem>
                <SelectItem value="Videography">Videography</SelectItem>
                <SelectItem value="Bundle">Bundle</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;