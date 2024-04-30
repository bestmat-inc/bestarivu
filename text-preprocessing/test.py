import process
import main

tokens = tokenize_sentence(input("Enter sentence to tokenize: "))
expanded_tokens = handle_abbreviations(tokens, abbreviation_rules)
print(expanded_tokens)