# ©2024 - BestArivu - BestMat, Inc. - All rights reserved.
import nltk, json
from nltk.tokenize import word_tokenize

# You may need to download NLTK data
nltk.download('punkt')

# Define a dictionary mapping programming language names to their respective file extensions
language_extensions = json.loads(open("./data/nlp-data/langauge_extensions.json"))

# Function to generate code based on user input
def generate_code(user_input, language):
    # Check if the language is supported
    if language.lower() not in language_extensions:
        return "Language not supported."

    # Tokenize the user input
    tokens = word_tokenize(user_input)

    # Check for keywords to determine the user's intent and generate code accordingly
    if "print" in tokens:
        return generate_print_statement(tokens, language)
    elif "loop" in tokens:
        return generate_loop(tokens, language)
    # Add more keyword checks and code generation logic for other intents as needed
    else:
        return "Unable to understand the user's intent."

# Function to generate a print statement in the specified language
def generate_print_statement(tokens, language):
    if language.lower() == "python":
        return "print('" + ' '.join(tokens[tokens.index("print")+1:]) + "')"
    elif language.lower() == "java":
        return "System.out.println('" + ' '.join(tokens[tokens.index("print")+1:]) + "');"

# Function to generate a loop in the specified language
def generate_loop(tokens, language):
    loop_type = ""
    loop_variable = ""
    loop_range = ""

    # Extract loop type
    if "for" in tokens:
        loop_type = "for"
    elif "while" in tokens:
        loop_type = "while"
    
    # Extract loop variable and range
    if loop_type:
        if "from" in tokens:
            index_from = tokens.index("from")
            if "to" in tokens:
                index_to = tokens.index("to")
                loop_variable = tokens[index_from + 1]
                loop_range = range(int(tokens[index_from + 2]), int(tokens[index_to + 1]))
            elif "till" in tokens:
                index_till = tokens.index("till")
                loop_variable = tokens[index_from + 1]
                loop_range = range(int(tokens[index_from + 2]), int(tokens[index_till + 1]) + 1)

    # Generate code based on loop type and language
    if loop_type == "for":
        if language.lower() == "python":
            return f"for {loop_variable} in range({loop_range.start}, {loop_range.stop}):"
        elif language.lower() == "java":
            return f"for (int {loop_variable} = {loop_range.start}; {loop_variable} < {loop_range.stop}; {loop_variable}++) {{"
    elif loop_type == "while":
        if language.lower() == "python":
            return f"while {loop_variable} < {loop_range.stop}:"
        elif language.lower() == "java":
            return f"while ({loop_variable} < {loop_range.stop}) {{"

# Take user input
user_input = input("Enter your desired program in natural language: ")

# Take desired language input
desired_language = input("Enter the desired programming language (e.g., Python, Java): ")

# Generate code
generated_code = generate_code(user_input, desired_language)
print("Generated code:")
print(generated_code)
