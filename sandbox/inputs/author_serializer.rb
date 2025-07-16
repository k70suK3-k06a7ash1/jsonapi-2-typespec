# frozen_string_literal: true

class AuthorSerializer
  include JSONAPI::Serializer
  
  set_type :authors
  
  attributes :name, :email, :bio
  
  attribute :full_name do |author|
    "#{author.first_name} #{author.last_name}"
  end
  
  attribute :article_count do |author|
    author.articles.published.count
  end
  
  attribute :avatar_url, &:image_url
  
  has_many :articles
  has_many :social_links, record_type: :links
end