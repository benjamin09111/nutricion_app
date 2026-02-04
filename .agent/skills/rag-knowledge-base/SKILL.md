---
name: rag-knowledge-base
description: Best practices for Retrieval Augmented Generation (RAG) using Supabase pgvector and LangChain to provide context-aware AI responses.
---

# RAG Knowledge Base Standards

Efficiently connecting LLMs (GPT-4) with private knowledge (Medical Papers, Recipes, Patient History).

## 1. Vector Database: Supabase pgvector

Since we use Postgres, we use **pgvector**. No need for specialized DBs.

1. Enable extension: `create extension vector;`
2. Create table:
   ```sql
   create table documents (
     id bigserial primary key,
     content text,
     metadata jsonb,
     embedding vector(1536) -- OpenAI uses 1536 dims
   );
   ```

## 2. Chunking Strategy (Crucial)

- **Do not embed whole books**.
- **Sliding Window**: Overlap chunks to preserve context.
  - *Recipes*: Chunk by "Step" or "Ingredient Group".
  - *Medical Papers*: Chunk by "Paragraph" (~500 tokens).

## 3. Retrieval Strategy

- **Hybrid Search**: Combine Vector Search (Semantic) + Keyword Search (BM25).
  - *Why?* "Vitamin C" is a keyword. "Good for immunity" is semantic. You need both matches.
- **Reranking**: Use a reranker (Cohere/CrossEncoder) to sort the top 10 results from the DB before sending to GPT.

## 4. Prompt Engineering for RAG

Structure the prompt to force the LLM to use the context.

```text
You are a Clinical Nutrition Assistant. Answer based ONLY on the provided Context.
If the context doesn't have the answer, say "I don't know based on available clinical guidelines".

Context:
{retrieved_chunks}

Question:
{user_query}
```
