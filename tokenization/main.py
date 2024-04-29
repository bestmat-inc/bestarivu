def tokenize_sentence(sentence):
    """
    Tokenize a sentence into word tokens.

    Args:
    sentence (str): The input sentence to be tokenized.

    Returns:
    list: A list of word tokens.
    """
    tokens = []
    current_token = ''
    for char in sentence:
        # Check if the character is alphanumeric or an apostrophe (for contractions)
        if char.isalnum() or char == "'":
            current_token += char
        else:
            # Add the current token to the list if it's not empty
            if current_token:
                tokens.append(current_token)
                current_token = ''
            # If the character is not a space, add it as a separate token
            if char != ' ':
                tokens.append(char)
    # Add the last token if it's not empty
    if current_token:
        tokens.append(current_token)
    return tokens

def main():
    # Take user input for the sentence
    sentence = input("Enter a sentence to tokenize: ")
    tokens = tokenize_sentence(sentence)
    print(tokens)

if __name__ == "__main__":
    main()
