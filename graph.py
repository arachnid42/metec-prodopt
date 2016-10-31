from math import sqrt
from copy import copy
from exceptions import *


class VertexNodeData(object):
    """ An optional class to hold a graph vertex data if coordinates are enabled """

    def __init__(self, label, x, y):
        """ Class instance initialization

        :param label - string vertex label
        :param x - x coordinate of a vertex
        :param y - y coordinate of a vertex

        """
        self.label = label
        self.x = x
        self.y = y


class VertexNode(object):
    """ A class to hold a graph vertex """

    def __init__(self, data):
        """ Class instance initialization

        :param data - label of a vertex if has_coordinates is
               False. Otherwise VertexNodeData object.

        """
        self.__data = data

    def get_label(self):
        """ Return a label of a vertex

        :return: string label of a vertex

        """
        if isinstance(self.__data, VertexNodeData):
            return self.__data.label
        else:
            return self.__data

    def get_coordinates(self):
        """ Return coordinates of a vertex

        :return: tuple of (x,y) coordinates of a
                 vertex if has_coordinates is True.
                 Otherwise returns None.

        """
        if isinstance(self.__data, VertexNodeData):
            return self.__data.x, self.__data.y
        else:
            return None


class EdgeNode(object):
    """ A class to hold graph edge data such as weight and reference node """

    def __init__(self, vertex_node, weight=None):
        """ Class instance initialization

        :param vertex_node - VertexNode object that holds
               a vertex that this edge is pointing to
        :param weight - weight of an edge. Defaults to None
               but can't remain None due to a class architecture.

        """
        self.vertex_node = vertex_node
        self.weight = weight

    def __str__(self):
        return "Edge to %s with weight %s" % (self.vertex_node.get_label(), str(self.weight))


class Graph(object):
    """ Graph class that keeps track over oll the graph components

    Default weight of an edge with coordinates enabled is Euclidean
    distance between respective coordinates of two vertices that the
    edge connects.

    """

    def __init__(self, directed=False, coordinates=False, explicit_weight=False, aggregate_weight=False):
        """ Init method of a class

        :param directed - bool whether a graph created is directed. Defaults to False.
        :param coordinates - bool whether graph vertices have coordinates in a 2d space.
               Defaults to False.
        :param explicit_weight - bool whether to use explicitly passed weights for edges.
               Defaults to False.
        :param aggregate_weight - bool whether aggregate edge weights when encounter the
               edge that is already present in a graph. If enabled, every time the new edge
               passed and the graph already contains this edge with a certain weight assigned
               to it, the present weight would be incremented with a weight of passed in edge
               data. Defaults to False.

        :exception BadInitParameters - raised if passed in parameters are not of type bool
        """

        # validate whether input params are booleans
        if not (isinstance(directed, bool) and isinstance(coordinates, bool) and isinstance(explicit_weight, bool) and
                isinstance(aggregate_weight, bool)):
            raise BadInitParameters("Init parameters must be of type bool!")

        # input passed validation
        self.is_directed = directed
        self.has_coordinates = coordinates
        self.use_explicit_weight = explicit_weight
        self.aggregate_weight = aggregate_weight
        self.mapper = {}

    def add_vertex(self, label, x=None, y=None):
        """ Add a vertex to a graph

        :param label - string name of a vertex to create
        :param x - x coordinate of a vertex to create (if coordinates flag is enabled).
               If coordinates are not enabled, method ignores x's value. Defaults to None.
        :param y - y coordinate of a vertex to create (if coordinates flag is enabled).
               If coordinates are not enabled, method ignores y's value. Defaults to None.
        :exception NotIntegerCoordinates - raised if passed in vertex coordinates are not
                   of type integer.
        :exception NoCoordinatesPassed - raised when no coordinates flag is enabled and no
                   coordinates (x and y) are passed.

        :return True - vertex was added successfully. False otherwise.
        """

        # if the vertex with the same label and/or coordinates
        # present in a graph, don't insert this vertex
        if self.find_vertex_node_by_label(label) or self.find_vertex_node_by_coordinates(x, y):
            print("Vertex with passed label/coordinates is already exist")
            return False

        # validation of vertex data is passed
        # creating a vertex in a graph
        if self.has_coordinates:
            if x is not None and y is not None:
                if isinstance(x, int) and isinstance(y, int):
                    self.mapper[VertexNode(VertexNodeData(label, x, y))] = []
                    return True
                else:
                    raise NotIntegerCoordinates("Vertex coordinates must be integers!")
            else:
                raise NoCoordinatesPassed("No vertex coordinates passed while required!")
        else:
            self.mapper[VertexNode(label)] = []
            return True

    def add_edge(self, va_label, vb_label, weight=None):
        """ Add an edge between vertices A and B to a graph

        :param va_label - string label of a vertex A
        :param vb_label - string label of a vertex B
        :param weight - int weight of a vertex if
               use_explicit_weight is enabled.
               Ignored otherwise. Defaults to None.

        :return True - edge was added successfully or
                it's weight was incremented. False
                otherwise.
        """

        node_a = self.find_vertex_node_by_label(va_label)
        node_b = self.find_vertex_node_by_label(vb_label)
        if not node_a or not node_b:
            print("Both or one of the nodes doesn't exist in a graph! Edge is not added.")
            return False
        else:
            return self.__add_edge(node_a, node_b, weight)

    def __add_edge(self, node_a, node_b, weight):
        """ Handle backend job to add an edge between two nodes

        Counts in use_explicit_weight and aggregated_weight flags to
        add an edge and it's weight in a right way

        :param node_a - VertexNode object that holds a node A
        :param node_b - VertexNode object that holds a node B
        :param weight - weight of an edge

        :return True - edge was added successfully or
        it's weight was incremented. False
        otherwise.
        """

        if self.__is_connected(node_a, node_b) and self.__is_connected(node_b, node_a):
            if self.aggregate_weight:
                edge_node = self.__get_edge(node_a, node_b)
                edge_node.set_weight(edge_node.weight + weight)
                if not self.is_directed:
                    edge_node = self.__get_edge(node_b, node_a)
                    edge_node.set_weight(edge_node.weight + weight)
                print("Edge was already present but it's weight was incremented")
                return True
            else:
                return False
        else:
            edge_node = EdgeNode(node_b)
            if self.use_explicit_weight:
                if isinstance(weight, int) or isinstance(weight, float):
                    edge_node.weight = weight
                else:
                    raise BadEdgeWeight("Edge weight is not a number!")
            else:
                if self.has_coordinates:
                    na_coords = node_a.get_coordinates()
                    nb_coords = node_b.get_coordinates()
                    def_weight = sqrt((na_coords[0] - nb_coords[0]) ** 2 + (na_coords[1] - nb_coords[1]) ** 2)
                    edge_node.weight = def_weight

            if not self.__is_connected(node_a, node_b):
                self.mapper[node_a].append(edge_node)
            if not self.is_directed:
                if not self.__is_connected(node_b, node_a):
                    edge_node_copy = copy(edge_node)
                    edge_node_copy.vertex_node = node_a
                    self.mapper[node_b].append(edge_node_copy)
            return True

    def find_vertex_node_by_label(self, label):
        for node in self.mapper:
            if node.get_label() == label:
                return node
        return None

    def find_vertex_node_by_coordinates(self, x, y):
        if not self.has_coordinates:
            raise GraphHasNoCoordinatesForVertices("The graph instance has vertices with no coordinates!")
        else:
            for node in self.mapper:
                coords = node.get_coordinates()
                if coords[0] == x and coords[1] == y:
                    return node

    def __is_connected(self, node_a, node_b):
        """ Backend private method for determining whether two vertices are connected

        :param node_a - VertexNode object that holds node A
        :param node_b - VertexNode object that holds node B

        :return True - nodes are connected; False - otherwise
        """

        for edge_node in self.mapper[node_a]:
            if edge_node.vertex_node == node_b:
                return True
        return False

    def __get_edge(self, node_a, node_b):
        """ Return an edge between two node object given that it exists

        :param node_a - VertexNode object that holds node A
        :param node_b - VertexNode object that holds node B

        :return: EdgeNode that connects node A and node B
        """

        for edge_node in self.mapper[node_a]:
            if edge_node.vertex_node == node_b:
                return edge_node

    def __str__(self):

        stats = "# stats\nvertices: " + str(len(self.mapper)) + "\n"
        vertices = "# vertices\n"
        edges = "# edges\n"

        # variable to hold edges count
        edges_count = 0

        for vertex_node in self.mapper:
            vertices += str(vertex_node.get_label()) + "\t" + str(vertex_node.get_coordinates()) + "\n"

        for vertex_node, edge_nodes in self.mapper.items():
            for edge_node in edge_nodes:
                edges_count += 1
                edges += str(vertex_node.get_label()) + "\t" + str(edge_node.vertex_node.get_label()) + "\t" + \
                         str(edge_node.weight) + "\n"

        if not self.is_directed:
            edges_count //= 2

        stats += "edges: " + str(edges_count) + "\n"
        return "%s\n%s\n%s" % (vertices, edges, stats)
