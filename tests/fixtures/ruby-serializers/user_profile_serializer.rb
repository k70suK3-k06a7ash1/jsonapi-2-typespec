# User Profile Serializer with complex nested relationships
module Api
  module V3
    class UserProfileSerializer
      include JSONAPI::Serializer
      
      set_type :user_profiles
      set_id :uuid
      
      # User information attributes
      attributes :username, :email, :first_name, :last_name, :bio, :location, :website
      attributes :birth_date, :phone_number, :timezone, :language_preference
      attributes :email_verified, :phone_verified, :is_active, :is_premium
      attributes :created_at, :updated_at, :last_login_at
      
      # Computed attributes
      attribute :full_name do |user|
        "#{user.first_name} #{user.last_name}".strip
      end
      
      attribute :display_name do |user|
        user.full_name.present? ? user.full_name : user.username
      end
      
      attribute :age do |user|
        return nil unless user.birth_date
        ((Date.current - user.birth_date) / 365.25).floor
      end
      
      attribute :avatar_url do |user|
        user.avatar.attached? ? user.avatar.url : '/default-avatar.png'
      end
      
      attribute :profile_completion_percentage do |user|
        total_fields = 10
        completed_fields = [
          user.first_name, user.last_name, user.bio, user.location,
          user.website, user.birth_date, user.phone_number, user.avatar
        ].compact.size
        (completed_fields.to_f / total_fields * 100).round
      end
      
      attribute :member_since do |user|
        user.created_at.strftime('%B %Y')
      end
      
      attribute :account_status do |user|
        if user.is_active?
          user.is_premium? ? 'premium' : 'standard'
        else
          'inactive'
        end
      end
      
      # Attributes with method references
      attribute :follower_count, &:followers_count
      attribute :following_count, &:following_count
      attribute :posts_count, &:published_posts_count
      
      # Privacy-aware attributes
      attribute :public_email do |user, params|
        user.email_public? || params[:current_user] == user ? user.email : nil
      end
      
      attribute :contact_info do |user, params|
        if user.contact_visible? || params[:current_user]&.admin?
          {
            phone: user.phone_number,
            location: user.location,
            website: user.website
          }
        end
      end
      
      # Complex relationships
      belongs_to :primary_address, record_type: :addresses
      belongs_to :subscription, record_type: :user_subscriptions
      belongs_to :preferences, record_type: :user_preferences
      
      has_many :posts, record_type: :user_posts
      has_many :comments, record_type: :user_comments
      has_many :likes, record_type: :user_likes
      has_many :bookmarks, record_type: :user_bookmarks
      has_many :followers, record_type: :user_profiles
      has_many :following, record_type: :user_profiles
      has_many :addresses, record_type: :user_addresses
      has_many :social_accounts, record_type: :social_media_accounts
      has_many :notifications, record_type: :user_notifications
      
      has_one :billing_info, record_type: :billing_information
      has_one :privacy_settings, record_type: :user_privacy_settings
      
      # Cache options with user-specific namespace
      cache_options store: Rails.cache, namespace: 'user_profiles', expires_in: 1.hour
    end
  end
end