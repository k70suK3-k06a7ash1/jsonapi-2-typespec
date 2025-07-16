import "@typespec/rest";
import "@typespec/openapi3";

@service({
  title: "Ruby Serializers API",
  version: "1.0.0"
})
import "@typespec/rest";
import "@typespec/openapi3";

namespace RubyApi {
  /** Generated from Ruby ArticleSerializer */
  @discriminator("type")
  model Articles {
    /** Attribute title */
    title: string;
    /** Attribute content */
    content: string;
    /** Attribute published_at */
    published_at: string;
    /** Attribute reading_time */
    reading_time: string;
    /** Relationship author */
    author: Users;
    /** Relationship comments */
    comments: Comments[];
    /** Relationship tags */
    tags: Tags[];
  }

  /** Generated from Ruby AuthorSerializer */
  @discriminator("type")
  model Authors {
    /** Attribute name */
    name: string;
    /** Attribute email */
    email: string;
    /** Attribute bio */
    bio: string;
    /** Attribute avatar_url */
    avatar_url: string;
    /** Relationship articles */
    articles: Articles[];
    /** Relationship social_links */
    social_links: Links[];
  }

  /** Generated from Ruby CommentSerializer */
  @discriminator("type")
  model Comments {
    /** Attribute content */
    content: string;
    /** Attribute created_at */
    created_at: string;
    /** Relationship article */
    article: Article;
    /** Relationship author */
    author: Users;
  }

  /** List all articles resources */
  @route("/articles")
  @get
  op listArticles(): Articles[];

  /** Get a specific articles resource */
  @route("/articles/{id}")
  @get
  op getArticles(id: string): Articles;

  /** Create a new articles resource */
  @route("/articles")
  @post
  op createArticles(): void;

  /** Update a articles resource */
  @route("/articles/{id}")
  @patch
  op updateArticles(id: string): Articles;

  /** Delete a articles resource */
  @route("/articles/{id}")
  @delete
  op deleteArticles(id: string): void;

  /** List all authors resources */
  @route("/authors")
  @get
  op listAuthors(): Authors[];

  /** Get a specific authors resource */
  @route("/authors/{id}")
  @get
  op getAuthors(id: string): Authors;

  /** Create a new authors resource */
  @route("/authors")
  @post
  op createAuthors(): void;

  /** Update a authors resource */
  @route("/authors/{id}")
  @patch
  op updateAuthors(id: string): Authors;

  /** Delete a authors resource */
  @route("/authors/{id}")
  @delete
  op deleteAuthors(id: string): void;

  /** List all comments resources */
  @route("/comments")
  @get
  op listComments(): Comments[];

  /** Get a specific comments resource */
  @route("/comments/{id}")
  @get
  op getComments(id: string): Comments;

  /** Create a new comments resource */
  @route("/comments")
  @post
  op createComments(): void;

  /** Update a comments resource */
  @route("/comments/{id}")
  @patch
  op updateComments(id: string): Comments;

  /** Delete a comments resource */
  @route("/comments/{id}")
  @delete
  op deleteComments(id: string): void;

}