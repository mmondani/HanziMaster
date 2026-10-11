# Login
- Login mediante cuenta de Google
- En la base de datos hay una colección con los emails que se pueden autenticar

# Base de datos
- Se implementa en Firestore

# Secciones de la app
- La app cuenta con las siguientes secciones:
    - Idiomas: contiene el ABM de los idiomas que se quieren aprender. En cada idioma se define el layout de las flashcards y con qué funcionalidades cuenta
    - Flashcards: contiene el ABM y el listado de las flashcards para cada uno de los idiomas
    - Mazos: contiene el ABM y el listado de los mazos de flashcards para cada uno de los idiomas
- La sección idiomas se visita poco frecuentemente por lo que no debe tener un lugar importante en la app
- La mayor parte del tiempo el usuario lo pasa en las secciones de flashcards y mazos
- En la sección de flashcards y la de mazos, debe permitir elegir el idioma sobre el que se está trabajando

# Sección Idiomas
- Contine el ABM de los idiomas
- Un idioma consiste en los siguientes campos ingresados por el usuario:
    - Nombre: nombre con el que aparece en los listados
    - Campos de las cartas: ABM de los campos que contiene cada carta, indicando: nombre, descripción, tipo (texto, lista, número), valor por default (vacío o valor), si cuenta con text-to-speech, si es obligatorio u opcional
    - Las cartas deben tener por lo menos tres campos: la palabra en el idioma que se está estudiando, su traducción y tags. No pueden tener menos que estos tres campos.
    - Set inicial de tags para las cartas
    - Layouts flashcard: elección de campos que se muestran en cada layout, que posición ocupan y qué tamaño tienen. Un idioma puede tener varios layouts 

# Sección Flashcards
- Contiene el ABM de las flashcards para el idioma seleccionado
- Permite crear una a una las flashcards, rellenando los campos que fueron configurados
- Permite cargar un archivo csv con un listado de cartas, respetando los campos que fueron configurados
- Toda carta cuenta con tags (uno o más, puede estar vacío) que la clasifican y ayudan a filtrarlas y a crear mazos. Se cuenta con un set inicial de posibles tags para el idioma elegido, pero se pueden crear nuevos
- Al crear una tarjeta, se puede ingrear la palabra en el idioma que se está estudiando y presionar un botón para que una IA complete el resto de los campos. 
- Al completar los campos con IA, los tags deben corresponder a los que mejor se adapten del listado actual de tags para ese idioma (máximo 2)
- Al completar los campos con IA, el resultado puede ser editado por un humano
- Permite ver un listado de todas las tarjetas creadas
- Permite selección múltiple de tarjetas para crear un mazo o editar alguno de los campos masivamente
- Cuenta con un buscados de tarjetas. Busca en la palabra en el idioma que se está estudiando y en la traducción.
- A medida que se va buscando, se van mostrando las coincidencias
- Al presionar una tarjeta se puede ver su contenido y editarlo

# Sección Mazos
- Contiene el ABM de los mazos para el idioma seleccionado
- Permite crear un mazo, eligiendo las flashcards que lo van a componer
- Un mazo consiste en los siguientes campos:
    - Nombre
    - Listado de cartas
    - Modos de recorrida: permite elegir qué combinación de los layouts del idioma se van a usar como frente y reverso. Puede haber más de un modo de recorrida
    - Forma de aprendizaje: inicialmente solo se incluye la opción Libre, en donde el mazo siempre se recorre de forma aleatoria sin registrar si el usuario acertó o no
- Se puede ver un detalle de los campos que lo componen y editarlos

## Recorriendo un mazo
- Al presionar una mazo se consutla cuál de los modos de recorrida configurados se quiere usar
- Por cada flashcard que se muestra, si se hace un click o tap, se gira la carta
- Para recorrer el mazo se usa:
    - En PC: las flechas del teclado o se cuenta con flechas en la UI para hacer click
    - En mobile se hace swipe a izquierda y derecha
- Si los campos que se visualizan en el layout, tenían habilitado el text-to-speech, hay un ícono que lo indica y que al hacer click/tap reproduce el audio
- Al terminar el mazo completo, se pregunta si se quiere volver a mezclar o se quiere salir
- En cualquier momento, se puede salir del recorrido el mazo
