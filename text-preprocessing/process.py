def lowercase(tokens):
    """
    Convert all tokens to lowercase.

    Args:
    tokens (list): List of word tokens.

    Returns:
    list: List of word tokens converted to lowercase.
    """
    return [token.lower() for token in tokens]

def remove_special_characters(tokens):
    """
    Remove special characters from tokens.

    Args:
    tokens (list): List of word tokens.

    Returns:
    list: List of word tokens with special characters removed, except for apostrophes within words.
    """
    cleaned_tokens = []
    for token in tokens:
        cleaned_token = ''.join(char for i, char in enumerate(token) if char.isalnum() or (char == "'" and i > 0 and i < len(token)-1 and token[i-1].isalpha() and token[i+1].isalpha()))
        cleaned_tokens.append(cleaned_token)
    return cleaned_tokens

def remove_stopwords(tokens):
    """
    Remove stopwords from tokens.

    Args:
    tokens (list): List of word tokens.

    Returns:
    list: List of word tokens with stopwords removed.
    """
    stopwords = {
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", 
        "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", 
        "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", 
        "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", 
        "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", 
        "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", 
        "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", 
        "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", 
        "very", "s", "t", "can", "will", "just", "don", "should", "now"
    }
    cleaned_tokens = [token for token in tokens if token.lower() not in stopwords]
    return cleaned_tokens

def stem_porter(tokens):
    """
    Perform stemming using the Porter stemming algorithm.

    Args:
    tokens (list): List of word tokens.

    Returns:
    list: List of word tokens after stemming.
    """
    def stem_word(word):
        # Define step functions for Porter stemming algorithm
        def step1a(word):
            if word.endswith('sses'):
                return word[:-2]
            elif word.endswith('ies'):
                return word[:-2]
            elif word.endswith('ss'):
                return word
            else:
                return word[:-1]

        def step1b(word):
            if word.endswith('eed'):
                if len(word[:-3]) in measure(word[:-3]):
                    return word[:-1]
                else:
                    return word
            elif 'ed' in word:
                if word.endswith('ed') and has_vowel(word[:-2]):
                    return step1b_helper(word[:-2])
                if word.endswith('ed') and has_vowel(word[:-2]):
                    return step1b_helper(word[:-2])
                else:
                    return word
            elif 'ing' in word:
                if word.endswith('ing') and has_vowel(word[:-3]):
                    return step1b_helper(word[:-3])
                else:
                    return word
            else:
                return word

        def step1b_helper(word):
            if word.endswith('at') or word.endswith('bl') or word.endswith('iz'):
                return word + 'e'
            elif double_consonant(word) and not (word.endswith('l') or word.endswith('s') or word.endswith('z')):
                return word[:-1]
            elif measure(word) == 1 and ends_with_cvc(word):
                return word + 'e'
            else:
                return word

        def step1c(word):
            if word.endswith('y') and has_vowel(word[:-1]):
                return word[:-1] + 'i'
            else:
                return word

        def step2(word):
            step2_suffixes = {
                'ational': 'ate',
                'tional': 'tion',
                'enci': 'ence',
                'anci': 'ance',
                'izer': 'ize',
                'bli': 'ble',
                'alli': 'al',
                'entli': 'ent',
                'eli': 'e',
                'ousli': 'ous',
                'ization': 'ize',
                'ation': 'ate',
                'ator': 'ate',
                'alism': 'al',
                'iveness': 'ive',
                'fulness': 'ful',
                'ousness': 'ous',
                'aliti': 'al',
                'iviti': 'ive',
                'biliti': 'ble'
            }
            for suffix in step2_suffixes:
                if word.endswith(suffix):
                    stem = word[:-len(suffix)]
                    if measure(stem) > 0:
                        return stem + step2_suffixes[suffix]
                    else:
                        return word
            return word

        def step3(word):
            step3_suffixes = {
                'icate': 'ic',
                'ative': '',
                'alize': 'al',
                'iciti': 'ic',
                'ical': 'ic',
                'ful': '',
                'ness': ''
            }
            for suffix in step3_suffixes:
                if word.endswith(suffix):
                    stem = word[:-len(suffix)]
                    if measure(stem) > 0:
                        return stem + step3_suffixes[suffix]
                    else:
                        return word
            return word

        def step4(word):
            if word.endswith('al') or word.endswith('ance') or word.endswith('ence') or word.endswith('er') \
                    or word.endswith('ic') or word.endswith('able') or word.endswith('ible') or word.endswith('ant') \
                    or word.endswith('ement') or word.endswith('ment') or word.endswith('ent') or word.endswith('ion') \
                    or word.endswith('ou'):
                stem = word[:-2]
                if measure(stem) > 1:
                    return stem
                else:
                    return word
            elif word.endswith('ism') or word.endswith('ate') or word.endswith('iti') or word.endswith('ous') \
                    or word.endswith('ive') or word.endswith('ize'):
                stem = word[:-3]
                if measure(stem) > 1:
                    return stem
                else:
                    return word
            elif word.endswith('sion') or word.endswith('tion'):
                stem = word[:-4]
                if measure(stem) > 1:
                    return stem
                else:
                    return word
            return word

        def step5(word):
            if word.endswith('e'):
                stem = word[:-1]
                if measure(stem) > 1 or (measure(stem) == 1 and not ends_with_cvc(stem)):
                    return stem
                else:
                    return word
            elif word.endswith('ll'):
                stem = word[:-1]
                if measure(stem) > 1:
                    return stem
                else:
                    return word
            else:
                return word

        # Apply Porter stemming algorithm steps
        word = step1a(word)
        word = step1b(word)
        word = step1c(word)
        word = step2(word)
        word = step3(word)
        word = step4(word)
        word = step5(word)
        
        return word

    # Apply stemming to each token
    stemmed_tokens = [stem_word(token) for token in tokens]
    return stemmed_tokens

def measure(word):
    """
    Calculate the measure M of a word.

    Args:
    word (str): Input word.

    Returns:
    int: Measure M of the word.
    """
    vowels = 'aeiou'
    count = 0
    prev_char = None
    for char in word:
        if char in vowels and prev_char not in vowels:
            count += 1
        prev_char = char
    return count

def ends_with_cvc(word):
    """
    Check if a word ends with a consonant-vowel-consonant pattern.

    Args:
    word (str): Input word.

    Returns:
    bool: True if the word ends with a consonant-vowel-consonant pattern, False otherwise.
    """
    if len(word) >= 3:
        if word[-1] in 'aeiou' and word[-2] not in 'aeiou' and word[-3] in 'aeiou':
            return True
    return False

def has_vowel(word):
    """
    Check if a word contains a vowel.

    Args:
    word (str): Input word.

    Returns:
    bool: True if the word contains a vowel, False otherwise.
    """
    for char in word:
        if char in 'aeiou':
            return True
    return False

def double_consonant(word):
    """
    Check if a word ends with a double consonant.

    Args:
    word (str): Input word.

    Returns:
    bool: True if the word ends with a double consonant, False otherwise.
    """
    if len(word) >= 2 and word[-1] == word[-2] and word[-1] not in 'aeiou':
        return True
    return False
#tmrw i do lemmatization as it too hard
def normalize(tokens):
    """
    Normalize tokens by removing accents and diacritics.

    Args:
    tokens (list): List of word tokens.

    Returns:
    list: List of word tokens normalized.
    """
    normalized_tokens = []
    for token in tokens:
        normalized_token = remove_accents(token)
        normalized_tokens.append(normalized_token)
    return normalized_tokens

def remove_accents(token):
    """
    Remove accents and diacritics from a token.

    Args:
    token (str): Input token.

    Returns:
    str: Token with accents and diacritics removed.
    """
    # Dictionary mapping accented characters to their unaccented counterparts
    accent_dict = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
        'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
        'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
        'ã': 'a', 'õ': 'o',
        'ñ': 'n', 'ç': 'c',
        'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u',
        'ă': 'a', 'ĕ': 'e', 'ĭ': 'i', 'ŏ': 'o', 'ŭ': 'u',
        'ą': 'a', 'ę': 'e', 'į': 'i', 'ǫ': 'o', 'ų': 'u',
        'ć': 'c', 'ĉ': 'c', 'ċ': 'c', 'č': 'c',
        'ď': 'd', 'đ': 'd',
        'ě': 'e', 'ĝ': 'g', 'ğ': 'g', 'ġ': 'g', 'ģ': 'g',
        'ĥ': 'h', 'ħ': 'h',
        'ĩ': 'i', 'ī': 'i', 'į': 'i', 'ĵ': 'j', 'ķ': 'k',
        'ĸ': 'k', 'ĺ': 'l', 'ļ': 'l', 'ľ': 'l', 'ŀ': 'l',
        'ł': 'l',
        'ń': 'n', 'ņ': 'n', 'ň': 'n', 'ŋ': 'n',
        'ő': 'o', 'ō': 'o', 'ơ': 'o', 'œ': 'oe',
        'ŕ': 'r', 'ŗ': 'r', 'ř': 'r',
        'ś': 's', 'ŝ': 's', 'ş': 's', 'š': 's',
        'ţ': 't', 'ť': 't', 'ŧ': 't',
        'ũ': 'u', 'ū': 'u', 'ŭ': 'u', 'ů': 'u', 'ű': 'u',
        'ų': 'u',
        'ŵ': 'w', 'ŷ': 'y', 'ÿ': 'y', 'ý': 'y',
        'ź': 'z', 'ż': 'z', 'ž': 'z',
        'ź': 'z', 'ż': 'z', 'ž': 'z',
        'ẁ': 'w', 'ẃ': 'w', 'ẅ': 'w', 'ẇ': 'w', 'ẉ': 'w',
        'ẋ': 'x', 'ẍ': 'x', 'ẏ': 'y', 'ẑ': 'z',
        'ạ': 'a', 'ả': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a',
        'ẫ': 'a', 'ậ': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a',
        'ẵ': 'a', 'ặ': 'a', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
        'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ỉ': 'i', 'ị': 'i', 'ọ': 'o', 'ỏ': 'o', 'ố': 'o',
        'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o', 'ớ': 'o',
        'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o', 'ụ': 'u',
        'ủ': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u',
        'ự': 'u', 'ỳ': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'Ạ': 'A', 'Ả': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A',
        'Ẫ': 'A', 'Ậ': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A',
        'Ẵ': 'A', 'Ặ': 'A', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
        'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'Ỉ': 'I', 'Ị': 'I', 'Ọ': 'O', 'Ỏ': 'O', 'Ố': 'O',
        'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O', 'Ớ': 'O',
        'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O', 'Ụ': 'U',
        'Ủ': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U',
        'Ự': 'U', 'Ỳ': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y'
    }

    # Remove accents and diacritics
    normalized_token = ''.join(accent_dict.get(char, char) for char in token)
    return normalized_token

def expand_contractions(tokens):
    """
    Expand contractions in tokens.

    Args:
    tokens (list): List of word tokens.

    Returns:
    list: List of word tokens with contractions expanded.
    """
    contraction_mapping = {
        "ain't": "is not",
        "aren't": "are not",
        "can't": "cannot",
        "could've": "could have",
        "couldn't": "could not",
        "didn't": "did not",
        "doesn't": "does not",
        "don't": "do not",
        "hadn't": "had not",
        "hasn't": "has not",
        "haven't": "have not",
        "he'd": "he would",
        "he'll": "he will",
        "he's": "he is",
        "how'd": "how did",
        "how'll": "how will",
        "how's": "how is",
        "I'd": "I would",
        "I'll": "I will",
        "I'm": "I am",
        "I've": "I have",
        "isn't": "is not",
        "it'd": "it would",
        "it'll": "it will",
        "it's": "it is",
        "let's": "let us",
        "ma'am": "madam",
        "might've": "might have",
        "mightn't": "might not",
        "must've": "must have",
        "mustn't": "must not",
        "needn't": "need not",
        "shan't": "shall not",
        "she'd": "she would",
        "she'll": "she will",
        "she's": "she is",
        "should've": "should have",
        "shouldn't": "should not",
        "that's": "that is",
        "there's": "there is",
        "they'd": "they would",
        "they'll": "they will",
        "they're": "they are",
        "they've": "they have",
        "wasn't": "was not",
        "we'd": "we would",
        "we'll": "we will",
        "we're": "we are",
        "we've": "we have",
        "weren't": "were not",
        "what'll": "what will",
        "what're": "what are",
        "what's": "what is",
        "what've": "what have",
        "where's": "where is",
        "who'd": "who would",
        "who'll": "who will",
        "who're": "who are",
        "who's": "who is",
        "who've": "who have",
        "won't": "will not",
        "would've": "would have",
        "wouldn't": "would not",
        "y'all": "you all",
        "you'd": "you would",
        "you'll": "you will",
        "you're": "you are",
        "you've": "you have",
        "it'd've": "it would have",
        "it'll've": "it will have",
        "it'sn't": "it is not",
        "it'sn't've": "it is not have",
        "it'sn't'll": "it is not will",
        "it'sn't'll've": "it is not will have",
        "can't've": "cannot have",
        "couldn't've": "could not have",
        "hadn't've": "had not have",
    }

    expanded_tokens = []
    for token in tokens:
        expanded_token = contraction_mapping.get(token, token)
        expanded_tokens.append(expanded_token)
    return expanded_tokens
# Removing numbers based on context (confusing, do it tmrw)
# Removing URLs and Email Addresses (confusing do it tmrw)
def handle_abbreviations(tokens, abbreviation_rules):
    """
    Expand abbreviations in tokens using abbreviation rules.

    Args:
    tokens (list): List of word tokens.
    abbreviation_rules (dict): Dictionary containing abbreviation mappings.

    Returns:
    list: List of word tokens with abbreviations expanded.
    """
    expanded_tokens = []
    for token in tokens:
        if token.lower() in abbreviation_rules:
            expanded_tokens.append(abbreviation_rules[token.lower()])
        else:
            expanded_tokens.append(token)
    return expanded_tokens

# Example usage:
abbreviation_rules = {
    "dr": "doctor",
    "mr": "mister",
    "mrs": "missus",
    "ms": "miss",
    "prof": "professor",
    "dept": "department",
    "corp": "corporation",
    "inc": "incorporated",
    "ltd": "limited",
    "co": "company",
    "gov": "government",
    "ave": "avenue",
    "blvd": "boulevard",
    "st": "street",
    "rd": "road",
    "apt": "apartment",
    "bldg": "building",
    "fig": "figure",
    "jan": "january",
    "feb": "february",
    "mar": "march",
    "apr": "april",
    "jun": "june",
    "jul": "july",
    "aug": "august",
    "sep": "september",
    "oct": "october",
    "nov": "november",
    "dec": "december",
    "sun": "sunday",
    "mon": "monday",
    "tue": "tuesday",
    "wed": "wednesday",
    "thu": "thursday",
    "fri": "friday",
    "sat": "saturday",
    "k": "ok",
    "thx": "thanks",
    "ttyl": "talk to you later",
    "tmrw": "tomorrow",
    "etc": "et cetera",
    # Add more abbreviations as needed
}