import "@typespec/rest";
import "@typespec/openapi3";

@service({
  title: "Blog API TypeSpec",
  version: "1.0.0"
})
import "@typespec/rest";
import "@typespec/openapi3";

namespace BlogApi {
  /** Serializer for blog articles */
  @discriminator("type")
  model Articles {
    /** The article title */
    title: string;
    /** The article content */
    content: string;
    /** When the article was published */
    published_at?: utcDateTime | null;
    /** The article status */
    status: "draft" | "published" | "archived";
    /** The article author */
    author: Authors;
    /** Article tags */
    tags?: Tags[] | null;
  }

  /** Serializer for blog authors */
  @discriminator("type")
  model Authors {
    /** Author full name */
    name: string;
    /** Author email address */
    email: string;
    /** Author biography */
    bio?: string | null;
    /** Articles written by this author */
    articles: Articles[];
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

}