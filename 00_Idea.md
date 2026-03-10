# Quadro Designer

## Goal
* I want to start a small side business that matches well with my actual situation in daily living (managing a family with two kids) as my education (Phd in engineering and human medicine nearly finished).
* The product will be an app to design individual climing frames for kids using the modular system "Quadro". 
* The project should cover all aspects required to start a small business successfully, among other:
    * Building the app
    * Roadmap
    * Business plan
    * Possible ways for monetarization
    * etc.
* The business does not have to be commercially successful at a first point.
* The primary goal of this project is not to be commercially successful, but to understand and use newest AI technologies (focus on Claude Cowork) to extend my personal knowledge and profile. 
* The product output (preferable app) should be usable, as I need it to plan a climbin frame for my own kids.

## What "Quadro" is?
* Quadro is a modular system to build custom climibing stations for kids and rebuild them when wanted. 
* It consists of tubes of different lengths and couplings with different numbers of connection options. 
* To make the climbing frame stable and safe, the bars and couplings are connected with special screws. 

More information can be found on this page:
https://quadroshop.com

## App Requirements/Ideas:
* The user should be able to load all parts he already purchased to the app:
    * it should be possible to load all parts of the predefined packages by one single click
    * single parts from a package can be removed, e.g. if they are broken or lost
    * single parts can be loaded separately
* The user should be able to design individual climbing frames based on the parts he already has a home. This can be done by:
    * Feature based design:
        * The user can select predefined features and the app makes a few suggestions how these could be combined in a climbing frame.
        * A features is e.g. a play house, a ladder, a slide, a platform.
        * The user can select if he wants to use only parts he already possesses or if other packages or single parts can be included.
        * The app could also suggest one climbing frame using only existing parts and another one including parts that can be purchased using a (affiliate) link then. 
        * All climbing frames suggested by the app should be practically feasable and stable. 
    * Design from scratch:
        * The user can select from the parts he has at home and design step by step (tube by tube and connector by connector) and can thus build a digital twin of a future real climbing frame. 
        * If the user wants to select a part that he does not possess already, he is warned and will be given a link to purchase the reqkuired parts at the end. If available a suitable package will be suggested.
        * In a later version this could be extended by live design suggestions to create special features as well as an overall stable and practical climbing frame. This could e.g. cover warnings if the next step leads to a not stable climbing frame. 
* The app should check designed climbing frames for stability aspects:
    * The easiest way will be fixed rules, e.g. wider base to avoid tipping over, height/width and height/length ratio to access overall stability, maximal length of horizontal constructions without pillar.
    * Later real mechanical simulations can be performed automatically, covering e.g.
        * defined use cases like swinging on a horizontal tube, jumping etc.
        * specific local regulations used to license climbing frames on public places
* The app should include a database of existing models.
    * The user should be able to load, visualize (3D) and modify these model.
    * The models should include 
        * models provided by Quadro on its own Model Database (MDB).
        * models designed by other users (users the uploaded a model that is downloaded a lot by others could be rewarded in a future version, e.g. vouchers to buy more Quadro)

## Ideas with respect to the approach
* start with app development
    * provide understanding what quadro is and how it works
    * understand restrictions and problems of app development with respect to 3D visualization and 3D design 
    * check for products in similar fields, e.g. a modeller to digitally plan lego designs
* evaluate existing products as the quadro modeller provided by the original company 
    * how technical is it?
    * is it possible to load full packages there or must every tube and connector be loaded individually?
    * only available for windows
    * any additional features?
* business idea is not the primary focus in the first step, personal goal to adapt to newest AI technologies is more important


## Your tasks
* Please create a plan how to set this up
* Please let me know if you need more information
* Cowork should work to define architecture, acceptance criteria, other specificiations
* Claude Code should build the solution
* If helpful, with mutiple agents: building, testing, etc.
* Critically assess
* Ask questions instead of making assumptions
* Avoid reasoncy bias
* Suggest evidence based strategies and methods where applicable
* Use my information as a starting point, but evaluate it objectively and make better suggestions if necessary.

