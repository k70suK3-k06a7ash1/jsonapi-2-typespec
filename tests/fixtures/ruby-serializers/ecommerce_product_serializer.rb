# E-commerce Product Serializer for testing complex scenarios
class EcommerceProductSerializer
  include JSONAPI::Serializer
  
  set_type :products
  set_id :sku
  
  # Basic attributes with different types
  attributes :name, :description, :price, :currency, :weight, :in_stock, :created_at, :updated_at
  
  # Custom attribute with numeric computation
  attribute :price_with_tax do |product|
    product.price * (1 + product.tax_rate)
  end
  
  # Custom attribute with string formatting
  attribute :display_price do |product|
    "#{product.currency} #{sprintf('%.2f', product.price)}"
  end
  
  # Boolean attribute with logic
  attribute :is_available do |product|
    product.in_stock && product.active && !product.discontinued
  end
  
  # Attribute with method reference
  attribute :seo_title, &:generate_seo_title
  
  # Date formatting attribute
  attribute :formatted_created_date do |product|
    product.created_at.strftime('%B %d, %Y')
  end
  
  # Relationships
  belongs_to :category, record_type: :product_categories
  belongs_to :brand
  belongs_to :vendor, record_type: :suppliers
  
  has_many :reviews, record_type: :product_reviews
  has_many :variants, record_type: :product_variants
  has_many :images, record_type: :product_images
  has_many :tags, record_type: :product_tags
  
  has_one :featured_image, record_type: :product_images
  has_one :primary_category, record_type: :product_categories
  
  # Cache configuration
  cache_options store: Rails.cache, namespace: 'ecommerce', expires_in: 2.hours
end