import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCategories, useProducts, useShopSettings } from '@/hooks/useMenu';
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useUsersWithRoles, useUpdateUserRole } from '@/hooks/useUserManagement';
import { useUpdateShopSettings } from '@/hooks/useShopSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatMMK } from '@/types/pos';
import { Package, Settings, Users, Percent, Receipt, Edit, Trash2, X, Check, Loader2, Plus, FolderOpen } from 'lucide-react';
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

type AdminTab = 'products' | 'categories' | 'settings' | 'users' | 'tax' | 'receipt';

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'products', label: 'Products', icon: <Package className="h-5 w-5" /> },
  { id: 'categories', label: 'Categories', icon: <FolderOpen className="h-5 w-5" /> },
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

interface EditingCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface NewCategory {
  name: string;
  icon: string;
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>({ name: '', price_mmk: 0, category_id: '' });

  // Category state
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState<NewCategory>({ name: '', icon: '☕' });

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: shopSettingsData } = useShopSettings();
  const { data: users = [], isLoading: usersLoading } = useUsersWithRoles();
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const updateUserRole = useUpdateUserRole();
  const updateShopSettings = useUpdateShopSettings();

  const { activeShopId } = useAuth();
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [isCreatingShop, setIsCreatingShop] = useState(false);

  useEffect(() => {
    if (!activeShopId && !productsLoading && !categoriesLoading) {
      setShowCreateShop(true);
    } else {
      setShowCreateShop(false);
    }
  }, [activeShopId, productsLoading, categoriesLoading]);

  const handleCreateInitialShop = async () => {
    if (!newShopName.trim()) return;
    setIsCreatingShop(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not found');

      // 1. Create shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({ 
          name: newShopName,
          slug: newShopName.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // 2. Assign admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.user.id,
          shop_id: shop.id,
          role: 'admin'
        });

      if (roleError) throw roleError;

      // 3. Create default settings
      const { error: settingsError } = await supabase
        .from('shop_settings')
        .insert({
          shop_id: shop.id,
          name: newShopName,
          tax_enabled: true,
          tax_rate: 5,
          currency: 'MMK',
          currency_symbol: 'Ks'
        });

      if (settingsError) throw settingsError;

      window.location.reload();
    } catch (error: any) {
      toast.error('Failed to create shop: ' + error.message);
    } finally {
      setIsCreatingShop(false);
    }
  };

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

  // Product handlers
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

  // Category handlers
  const handleEditCategoryClick = (category: typeof categories[0]) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      icon: category.icon || '☕',
      sort_order: category.sort_order || 0,
    });
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCategory) return;
    updateCategory.mutate({
      id: editingCategory.id,
      name: editingCategory.name,
      icon: editingCategory.icon,
      sort_order: editingCategory.sort_order,
    }, {
      onSuccess: () => setEditingCategory(null),
    });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
  };

  const handleConfirmCategoryDelete = () => {
    if (!deleteCategoryId) return;
    deleteCategory.mutate(deleteCategoryId, {
      onSuccess: () => setDeleteCategoryId(null),
    });
  };

  const handleCreateCategory = () => {
    if (!newCategory.name) return;
    createCategory.mutate({
      name: newCategory.name,
      icon: newCategory.icon || '☕',
    }, {
      onSuccess: () => {
        setShowAddCategoryModal(false);
        setNewCategory({ name: '', icon: '☕' });
      },
    });
  };

  // Shop settings handlers
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

  // User role handler
  const handleRoleChange = (userId: string, role: 'cashier' | 'supervisor' | 'admin') => {
    updateUserRole.mutate({ userId, role });
  };

  return (
    <div className="pos-container">
      <Sidebar />

      {showCreateShop && (
        <Dialog open={showCreateShop} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Your First Shop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="e.g. My Awesome Cafe"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateInitialShop}
                disabled={!newShopName.trim() || isCreatingShop}
              >
                {isCreatingShop ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Shop & Get Started
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

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

          {activeTab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-display font-bold">Categories</h1>
                <Button className="btn-touch-sm" onClick={() => setShowAddCategoryModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>

              {categoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium">Icon</th>
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Products</th>
                        <th className="text-left py-3 px-4 font-medium">Sort Order</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => {
                        const productCount = products.filter((p) => p.category_id === category.id).length;
                        const isEditing = editingCategory?.id === category.id;

                        return (
                          <tr key={category.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <Input
                                  value={editingCategory.icon}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                  className="w-16 text-center"
                                  maxLength={2}
                                />
                              ) : (
                                <span className="text-2xl">{category.icon || '☕'}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <Input
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                  className="w-48"
                                />
                              ) : (
                                <span className="font-medium">{category.name}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-muted-foreground">{productCount} products</span>
                            </td>
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editingCategory.sort_order}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value) || 0 })}
                                  className="w-20"
                                />
                              ) : (
                                <span>{category.sort_order || 0}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button 
                                    onClick={handleSaveCategoryEdit}
                                    disabled={updateCategory.isPending}
                                    className="p-2 hover:bg-success/10 rounded-lg"
                                  >
                                    {updateCategory.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : (
                                      <Check className="h-4 w-4 text-success" />
                                    )}
                                  </button>
                                  <button 
                                    onClick={handleCancelCategoryEdit}
                                    className="p-2 hover:bg-muted rounded-lg"
                                  >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleEditCategoryClick(category)}
                                    className="p-2 hover:bg-muted rounded-lg"
                                  >
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                  <button 
                                    onClick={() => setDeleteCategoryId(category.id)}
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
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-6">
                  <p className="text-muted-foreground">No users found. Users will appear here once they sign up.</p>
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium">User</th>
                        <th className="text-left py-3 px-4 font-medium">Joined</th>
                        <th className="text-left py-3 px-4 font-medium">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium">
                                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                                <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value as 'cashier' | 'supervisor' | 'admin')}
                              disabled={updateUserRole.isPending}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cashier">Cashier</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Product Confirmation Dialog */}
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

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Products in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCategoryDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? (
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

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryIcon">Icon (emoji)</Label>
              <Input
                id="categoryIcon"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                placeholder="☕"
                className="w-20 text-center text-2xl"
                maxLength={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddCategoryModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCategory} 
              disabled={!newCategory.name || createCategory.isPending}
            >
              {createCategory.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
