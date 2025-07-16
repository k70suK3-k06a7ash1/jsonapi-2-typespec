# frozen_string_literal: true

class ArticleSerializer
  include JSONAPI::Serializer
  
  set_type :articles
  set_id :article_id
  
  attributes :title, :content, :published_at
  
  attribute :status do |article|
    article.published? ? 'published' : 'draft'
  end
  
  attribute :reading_time, &:estimated_reading_time
  
  belongs_to :author, record_type: :users
  has_many :comments
  has_many :tags
  
  cache_options store: Rails.cache, namespace: 'jsonapi-serializer', expires_in: 1.hour
end