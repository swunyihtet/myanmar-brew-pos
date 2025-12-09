import { useState } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { products, categories, shopSettings as defaultSettings } from '@/data/seedData';
import { formatMMK } from '@/types/pos';
import { Package, Settings, Users, Percent, Receipt, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminTab = 'products' | 'settings' | 'users' | 'tax' | 'receipt';

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'products', label: 'Products', icon: <Package className="h-5 w-5" /> },
  { id: 'tax', label: 'Tax & Discounts', icon: <Percent className="h-5 w-5" /> },
  { id: 'receipt', label: 'Receipt Settings', icon: <Receipt className="h-5 w-5" /> },
  { id: 'users', label: 'Users & Roles', icon: <Users className="h-5 w-5" /> },
  { id: 'settings', label: 'Shop Settings', icon: <Settings className="h-5 w-5" /> },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [shopSettings, setShopSettings] = useState(defaultSettings);

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
                <Button className="btn-touch-sm">+ Add Product</Button>
              </div>

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
                      const category = categories.find((c) => c.id === product.categoryId);
                      return (
                        <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {category?.icon}
                              </span>
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 capitalize">{category?.name}</td>
                          <td className="py-3 px-4 font-semibold">{formatMMK(product.basePrice)}</td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              'status-badge',
                              product.isAvailable ? 'status-ready' : 'bg-muted text-muted-foreground'
                            )}>
                              {product.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="p-2 hover:bg-muted rounded-lg">
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button className="p-2 hover:bg-muted rounded-lg">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                      checked={shopSettings.taxEnabled}
                      onCheckedChange={(checked) => 
                        setShopSettings({ ...shopSettings, taxEnabled: checked })
                      }
                    />
                  </div>

                  {shopSettings.taxEnabled && (
                    <>
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-2 block">Tax Rate (%)</label>
                        <Input
                          type="number"
                          value={shopSettings.taxRate}
                          onChange={(e) => 
                            setShopSettings({ ...shopSettings, taxRate: parseFloat(e.target.value) || 0 })
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
                          checked={shopSettings.taxInclusive}
                          onCheckedChange={(checked) => 
                            setShopSettings({ ...shopSettings, taxInclusive: checked })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Discount Settings</h3>
                  <p className="text-muted-foreground text-sm">
                    Discounts can be applied at checkout. Configure manager PIN for void/refund operations.
                  </p>
                  <div className="mt-4">
                    <label className="text-sm font-medium mb-2 block">Manager PIN</label>
                    <Input type="password" placeholder="****" className="w-32" />
                  </div>
                </div>
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
                    value={shopSettings.receiptHeader}
                    onChange={(e) => 
                      setShopSettings({ ...shopSettings, receiptHeader: e.target.value })
                    }
                    placeholder="Welcome message..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Receipt Footer Message</label>
                  <Textarea
                    value={shopSettings.receiptFooter}
                    onChange={(e) => 
                      setShopSettings({ ...shopSettings, receiptFooter: e.target.value })
                    }
                    placeholder="Thank you message..."
                    rows={2}
                  />
                </div>

                <Button className="mt-4">Save Changes</Button>
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
                    value={shopSettings.name}
                    onChange={(e) => 
                      setShopSettings({ ...shopSettings, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <Textarea
                    value={shopSettings.address}
                    onChange={(e) => 
                      setShopSettings({ ...shopSettings, address: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input
                    value={shopSettings.phone}
                    onChange={(e) => 
                      setShopSettings({ ...shopSettings, phone: e.target.value })
                    }
                  />
                </div>

                <Button className="mt-4">Save Changes</Button>
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
                  User management requires database connection. Connect to Supabase to enable authentication and role-based access control.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
