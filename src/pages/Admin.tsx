import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCategories, useProducts, useShopSettings } from '@/hooks/useMenu';
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useUpdateShopSettings } from '@/hooks/useShopSettings';
import { formatMMK } from '@/types/pos';
import { Package, Settings, Users, Percent, Receipt, Edit, Trash2, X, Check, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AdminTab = 'products' | 'settings' | 'users' | 'tax' | 'receipt';

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'products', label: 'Products', icon: <Package className="h-5 w-5" /> },
  { id: 'tax', label: 'Tax & Discounts', icon: <Percent className="h-5 w-5" /> },
  { id: 'receipt', label: 'Receipt Settings', icon: <Receipt className="h-5 w-5" /> },
  { id: 'users', label: 'Users & Roles', icon: <Users className="h-5 w-5" /> },
  { id: 'settings', label: 'Shop Settings', icon: <Settings className="h-5 w-5" /> },
];

interface EditingProduct {
  id: string;
  name: string;
  price_mmk: number;
  is_active: boolean;
}

interface NewProduct {
  name: string;
  price_mmk: number;
  category_id: string;
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>({ name: '', price_mmk: 0, category_id: '' });

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: shopSettingsData } = useShopSettings();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateShopSettings = useUpdateShopSettings();

  const [localShopSettings, setLocalShopSettings] = useState({
    taxEnabled: true,
    taxRate: 5,
    taxInclusive: false,
    receiptHeader: 'Welcome to Golden Bean!',
    receiptFooter: 'Thank you for visiting!',
    name: 'Golden Bean Coffee',
    address: 'No. 42, Shwedagon Pagoda Road, Yangon',
    phone: '+95 9 123 456 789',
  });

  // Sync shop settings from DB when loaded
  useEffect(() => {
    if (shopSettingsData) {
      setLocalShopSettings({
        taxEnabled: shopSettingsData.tax_enabled ?? true,
        taxRate: Number(shopSettingsData.tax_rate) ?? 5,
        taxInclusive: shopSettingsData.tax_inclusive ?? false,
        receiptHeader: shopSettingsData.receipt_header ?? '',
        receiptFooter: shopSettingsData.receipt_footer ?? '',
        name: shopSettingsData.name ?? '',
        address: shopSettingsData.address ?? '',
        phone: shopSettingsData.phone ?? '',
      });
    }
  }, [shopSettingsData]);

  const handleEditClick = (product: typeof products[0]) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price_mmk: product.price_mmk,
      is_active: product.is_active ?? true,
    });
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    updateProduct.mutate({
      id: editingProduct.id,
      name: editingProduct.name,
      price_mmk: editingProduct.price_mmk,
      is_active: editingProduct.is_active,
    }, {
      onSuccess: () => setEditingProduct(null),
    });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteProductId) return;
    deleteProduct.mutate(deleteProductId, {
      onSuccess: () => setDeleteProductId(null),
    });
  };

  const handleCreateProduct = () => {
    if (!newProduct.name || newProduct.price_mmk <= 0) return;
    createProduct.mutate({
      name: newProduct.name,
      price_mmk: newProduct.price_mmk,
      category_id: newProduct.category_id || undefined,
    }, {
      onSuccess: () => {
        setShowAddProductModal(false);
        setNewProduct({ name: '', price_mmk: 0, category_id: '' });
      },
    });
  };

  const handleSaveShopSettings = () => {
    updateShopSettings.mutate({
      name: localShopSettings.name,
      address: localShopSettings.address,
      phone: localShopSettings.phone,
    });
  };

  const handleSaveTaxSettings = () => {
    updateShopSettings.mutate({
      tax_enabled: localShopSettings.taxEnabled,
      tax_rate: localShopSettings.taxRate,
      tax_inclusive: localShopSettings.taxInclusive,
    });
  };

  const handleSaveReceiptSettings = () => {
    updateShopSettings.mutate({
      receipt_header: localShopSettings.receiptHeader,
      receipt_footer: localShopSettings.receiptFooter,
    });
  };

  return (
    <div className="pos-container">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Admin Sidebar */}
        <div className="w-64 bg-card border-r border-border p-4">
          <h2 className="text-lg font-display font-bold text-foreground mb-4">Admin Panel</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-display font-bold">Products</h1>
                <Button className="btn-touch-sm" onClick={() => setShowAddProductModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium">Product</th>
                        <th className="text-left py-3 px-4 font-medium">Category</th>
                        <th className="text-left py-3 px-4 font-medium">Price</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const category = categories.find((c) => c.id === product.category_id);
                        const isEditing = editingProduct?.id === product.id;

                        return (
                          <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {category?.icon || '☕'}
                                </span>
                                {isEditing ? (
                                  <Input
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-48"
                                  />
                                ) : (
                                  <span className="font-medium">{product.name}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 capitalize">{category?.name || '-'}</td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editingProduct.price_mmk}
                                  onChange={(e) => setEditingProduct({ ...editingProduct, price_mmk: parseInt(e.target.value) || 0 })}
                                  className="w-28"
                                />
                              ) : (
                                <span className="font-semibold">{formatMMK(product.price_mmk)}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <Switch
                                  checked={editingProduct.is_active}
                                  onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, is_active: checked })}
                                />
                              ) : (
                                <span className={cn(
                                  'status-badge',
                                  product.is_active ? 'status-ready' : 'bg-muted text-muted-foreground'
                                )}>
                                  {product.is_active ? 'Available' : 'Unavailable'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button 
                                    onClick={handleSaveEdit}
                                    disabled={updateProduct.isPending}
                                    className="p-2 hover:bg-success/10 rounded-lg"
                                  >
                                    {updateProduct.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : (
                                      <Check className="h-4 w-4 text-success" />
                                    )}
                                  </button>
                                  <button 
                                    onClick={handleCancelEdit}
                                    className="p-2 hover:bg-muted rounded-lg"
                                  >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleEditClick(product)}
                                    className="p-2 hover:bg-muted rounded-lg"
                                  >
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                  <button 
                                    onClick={() => setDeleteProductId(product.id)}
                                    className="p-2 hover:bg-destructive/10 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tax' && (
            <div>
              <h1 className="text-2xl font-display font-bold mb-6">Tax & Discount Settings</h1>

              <div className="space-y-6 max-w-lg">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Tax Settings</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Enable Tax</p>
                      <p className="text-sm text-muted-foreground">Apply tax to all orders</p>
                    </div>
                    <Switch
                      checked={localShopSettings.taxEnabled}
                      onCheckedChange={(checked) => 
                        setLocalShopSettings({ ...localShopSettings, taxEnabled: checked })
                      }
                    />
                  </div>

                  {localShopSettings.taxEnabled && (
                    <>
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-2 block">Tax Rate (%)</label>
                        <Input
                          type="number"
                          value={localShopSettings.taxRate}
                          onChange={(e) => 
                            setLocalShopSettings({ ...localShopSettings, taxRate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-32"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Tax Inclusive Pricing</p>
                          <p className="text-sm text-muted-foreground">Prices already include tax</p>
                        </div>
                        <Switch
                          checked={localShopSettings.taxInclusive}
                          onCheckedChange={(checked) => 
                            setLocalShopSettings({ ...localShopSettings, taxInclusive: checked })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={handleSaveTaxSettings} disabled={updateShopSettings.isPending}>
                  {updateShopSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div>
              <h1 className="text-2xl font-display font-bold mb-6">Receipt Settings</h1>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Receipt Header Message</label>
                  <Textarea
                    value={localShopSettings.receiptHeader}
                    onChange={(e) => 
                      setLocalShopSettings({ ...localShopSettings, receiptHeader: e.target.value })
                    }
                    placeholder="Welcome message..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Receipt Footer Message</label>
                  <Textarea
                    value={localShopSettings.receiptFooter}
                    onChange={(e) => 
                      setLocalShopSettings({ ...localShopSettings, receiptFooter: e.target.value })
                    }
                    placeholder="Thank you message..."
                    rows={2}
                  />
                </div>

                <Button onClick={handleSaveReceiptSettings} disabled={updateShopSettings.isPending}>
                  {updateShopSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h1 className="text-2xl font-display font-bold mb-6">Shop Settings</h1>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Shop Name</label>
                  <Input
                    value={localShopSettings.name}
                    onChange={(e) => 
                      setLocalShopSettings({ ...localShopSettings, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <Textarea
                    value={localShopSettings.address}
                    onChange={(e) => 
                      setLocalShopSettings({ ...localShopSettings, address: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input
                    value={localShopSettings.phone}
                    onChange={(e) => 
                      setLocalShopSettings({ ...localShopSettings, phone: e.target.value })
                    }
                  />
                </div>

                <Button onClick={handleSaveShopSettings} disabled={updateShopSettings.isPending}>
                  {updateShopSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-display font-bold">Users & Roles</h1>
                <Button className="btn-touch-sm">+ Add User</Button>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <p className="text-muted-foreground">
                  User management is available. Users are assigned roles (cashier, supervisor, admin) when they sign up.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productPrice">Price (MMK)</Label>
              <Input
                id="productPrice"
                type="number"
                value={newProduct.price_mmk || ''}
                onChange={(e) => setNewProduct({ ...newProduct, price_mmk: parseInt(e.target.value) || 0 })}
                placeholder="Enter price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCategory">Category</Label>
              <Select
                value={newProduct.category_id}
                onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddProductModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProduct} 
              disabled={!newProduct.name || newProduct.price_mmk <= 0 || createProduct.isPending}
            >
              {createProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
