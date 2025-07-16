# frozen_string_literal: true

module Api
  module V1
    class CommentSerializer
      include JSONAPI::Serializer
      
      set_type :comments
      
      attributes :content, :created_at
      
      attribute :is_approved do |comment|
        comment.approved?
      end
      
      belongs_to :article
      belongs_to :author, record_type: :users
    end
  end
end