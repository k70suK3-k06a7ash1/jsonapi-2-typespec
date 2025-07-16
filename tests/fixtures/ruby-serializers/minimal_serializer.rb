# Minimal serializer for testing basic functionality
class MinimalSerializer
  include JSONAPI::Serializer
  
  set_type :minimal_items
  
  attributes :name, :value
end